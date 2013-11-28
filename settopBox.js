/******************************************************************
  Main controller object.
******************************************************************/
function SettopBox() {
  this.init();
}

SettopBox.gebi = function(id) {
  return document.getElementById(id);
}

SettopBox.prototype = (function() {

  return {
    init : function() {
      this._nav = new NavMenu(SettopBoxData.navMenu);
      this._mainContent = new MainContent(SettopBoxData.screens.suggestions);

      //refreshes content section when select diff nav items.
      EventManager.addEventListener('showContent', this._mainContent);

      //catch right arrow when moving from nav to main content section
      EventManager.addEventListener('focusContent', this);

      //catch left arrow when moving from  main content to nav section
      EventManager.addEventListener('focusNav', this);
    },

    render : function(id) {
      var html = [];

      html.push('<div class="topBorder"></div>');
      html.push('<div class="nav">');
        this._nav.render(html);
      html.push('</div>');
      html.push('<div class="mainContent">');
        this._mainContent.render(html);
      html.push('</div>');
      html.push('<div style="clear:both;"/>');

      SettopBox.gebi(id).innerHTML = html.join('');
    },

    handleKeyPress : function(evt) {
      /*
        13: enter
        37 : left   //52 (4) 
        38: up      //56 (8)
        39: right   //54 (6)
        40: down    //53 (5)
      */
      var keyCode = evt.which;

      SettopBox.gebi('mybod').innerHTML += ' * ' + evt.which;

      if (this._nav.hasFocus())
        this._nav.handleKeyPress(keyCode);  

      else if (this._mainContent.hasFocus())
        this._mainContent.handleKeyPress(keyCode);  
    },

    handleEvent : function(evt) {
      if (evt.type === 'focusContent') {
        this._nav.setFocus(false);
        this._mainContent.setFocus(true);
      }
      else if (evt.type === 'focusNav') {
        this._nav.setFocus(true);
        this._mainContent.setFocus(false);
      }
    }
  }

})();


/******************************************************************
  Left navigation menu.
******************************************************************/
function NavMenu(data) {
  this.init(data);
}

NavMenu.prototype = (function() {

  return {
    init : function(data) {
      if (data && data.length > 0)
        this._data = data;
      else 
        this._data = [];

      this._hasFocus = true;
      this._selectedIndex = 0;
    },

    render : function(html) {
      if (this._data.length != 0) {
        html.push('<ul>');

        for (var idx = 0; idx < this._data.length; idx++)
          html.push('<li id="li', idx, '" ',
                        'class="', (idx == 0 ? 'selected' : 'normal'), '" ',
                        'value="', this._data[idx].key, '">', this._data[idx].label, '</li>');

        html.push('</ul>');
      }
    },

    hasFocus : function() {
      return this._hasFocus;
    },

    setFocus : function(bool) {
      this._hasFocus = bool;

      if (bool) 
        SettopBox.gebi('li' + this._selectedIndex).className = 'selected';
      else
        SettopBox.gebi('li' + this._selectedIndex).className = 'selected_disabled';
    },

    handleKeyPress : function(keyCode) {
      //up
      if (keyCode == 38 || keyCode == 56 && 
          this._selectedIndex != 0) {
        var liObj = SettopBox.gebi('li' + this._selectedIndex);
        liObj.className = 'normal';

        this._selectedIndex--;
        liObj = SettopBox.gebi('li' + this._selectedIndex);

        var key = liObj.getAttribute('value');
        liObj.className = 'selected';

        EventManager.dispatch({ type: 'showContent', args: { contentPage: key} });
      }

      //down
      else if (keyCode == 40 || keyCode == 53 &&
               this._selectedIndex < this._data.length - 1) {
        var liObj = SettopBox.gebi('li' + this._selectedIndex);
        liObj.className = 'normal';

        this._selectedIndex++
        liObj = SettopBox.gebi('li' + this._selectedIndex);

        var key = liObj.getAttribute('value');
        liObj.className = 'selected';

        EventManager.dispatch({ type: 'showContent', args: { contentPage: key} });
      }

      //right or enter key
      else if (keyCode == 39 || keyCode == 54 || keyCode == 13)
        EventManager.dispatch({ type: 'focusContent' });
    }
  }

})();



/******************************************************************
  Main content section.
******************************************************************/
function MainContent(data) {
  this.init(data);
}

MainContent.prototype = (function() {

  return {
    init : function(data) {
      this._data = data;
      this._hasFocus = false;
      this._setupMovieList();
    },

    render : function(html) {
      html.push('<div id="mainContent">');
        html.push('<div class="fontStyle">', this._data.pageTitle, '</div>',
                  '<p>');

      for (var idx = 0; idx < this._movieList.length; idx++) {

        if (this._movieList[idx].length > 0) {
          html.push('<div>');

          for (var idx2 = 0; idx2 < this._movieList[idx].length; idx2++)
            this._movieList[idx][idx2].render(html);

          html.push('</div><p>');
        }
      }
      html.push('</div>');
      
    },
   
    hasFocus : function() {
      return this._hasFocus;
    },

    setFocus : function(bool) {
      this._hasFocus = bool;

      //hardcode to always set focus to the first item.
      if (bool) {
        this._movieList[0][0].select(true);
        this._selectedMovie = { row: 0, col: 0 };
      }
      else {
        this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(false);
        delete this._selectedMovie;
      }
    },

    setData : function(data) {
      this._data = data;
      this._setupMovieList();

      var html = [];
      this.render(html);

      SettopBox.gebi('mainContent').innerHTML = html.join('');      
    },

    handleKeyPress : function(keyCode) {
            
      //up
      if (keyCode == 38 || keyCode == 56) {
        if (this._selectedMovie.row > 0) {
          this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(false);
          this._selectedMovie.row--;
          this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(true);
        }
      }

      //down
      else if (keyCode == 40 || keyCode == 53) {
        if (this._selectedMovie.row < this._movieList.length) {

          //check the row below is there is a movie down there
          var nextRow = this._selectedMovie.row + 1;

          if (this._movieList[nextRow] && this._movieList[nextRow].length - 1 >= this._selectedMovie.col) {
            this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(false);
            this._selectedMovie.row++;
            this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(true);
          }
        }
      }

      //right
      else if (keyCode == 39 || keyCode == 54) {
        if (this._selectedMovie.col < this._movieList[this._selectedMovie.row].length - 1) {
          this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(false);
          this._selectedMovie.col++;
          this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(true);
        }
      }

      //left 
      else if (keyCode ==  37 || keyCode == 52) {
        if (this._selectedMovie.col > 0) {
          this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(false);
          this._selectedMovie.col--;
          this._movieList[this._selectedMovie.row][this._selectedMovie.col].select(true);
        }
        else
          EventManager.dispatch({ type: 'focusNav' });
      }

      //enter key
      else if (keyCode == 13)
        alert('You chose \"' +  this._movieList[this._selectedMovie.row][this._selectedMovie.col].getTitle() + '\"');
    },

    handleEvent : function(evt) {
      if (evt && evt.type && evt.type === 'showContent' && evt.args && evt.args.contentPage) 
        this.setData(SettopBoxData.screens[evt.args.contentPage]);
    },

    _setupMovieList : function() {
      this._movieList = [];

      if (this._data.movies) {

        for (var idx = 0; idx < this._data.movies.length; idx++) {
          var _tmp = [];

          for (var idx2 = 0; idx2 < this._data.movies[idx].length; idx2++)
            _tmp.push(new MovieBox(this._data.movies[idx][idx2]));

          this._movieList.push(_tmp);
        }
      }
    }
  }

})();


/******************************************************************
  Object representing Movie box in the content pane.
******************************************************************/
function MovieBox(data) {
  this.init(data);
}

MovieBox.prototype = (function() {

  return {
    init : function(data) {
      this._data = data;
      this._mb = SettopBoxData.boxArt[data];
    },

    render : function(html) {
      html.push('<span class="movieBoxContainer">', 
                  '<img id="movie', this._data, '" class="movieBox" src="', this._mb.path, '">',
                '</span>');
    },
  
    getTitle : function() {
      return this._mb.title;
    },

    select : function(bool) {
      bool ? 
        SettopBox.gebi('movie' + this._data).className = 'movieBox mb_selected' : 
        SettopBox.gebi('movie' + this._data).className = 'movieBox';
    }
  }

})();



/******************************************************************
  Crude event registry and dispatcher.  Does not assume a source 
  event dispatcher cuz this static object is the source.
******************************************************************/

function EventManager() {
}

EventManager.events = {};

EventManager.addEventListener = function(type, listener) {
  if (!EventManager.events[type])
    EventManager.events[type] = [];

  EventManager.events[type].push(listener);
}

/* 
  Event object here looks like this:

  {  type: <event name>, args: <dataObject> }
*/
EventManager.dispatch = function(event) {
  if (EventManager.events[event.type]) {
    var listenerArr = EventManager.events[event.type];

    for (var idx = 0; idx < listenerArr.length; idx++) {
      if (listenerArr[idx].handleEvent)      
        listenerArr[idx].handleEvent(event);
    }

  }
}
