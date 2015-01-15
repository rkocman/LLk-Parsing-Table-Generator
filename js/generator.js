/*!
 * LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Author: Radim Kocman
 */


////
// GRAMMAR OBJECTS
//////

var GType = {
  T : 1, // terminal
  N : 2  // nonterminal
};

var GElement = function(type, value) {
  this.type = type;
  this.value = value;
};

var GRule = function() {
  this.left;
  this.right = [];
};
GRule.prototype.setLeft = function(gelement) {
  this.left = gelement;
};
GRule.prototype.addRight = function(gelement) {
  this.right.push(gelement);
};

var Grammar = function() {
  this.N = [];
  this.R = [];
};
Grammar.prototype.addN = function(gelement) {
  this.N.push(gelement);
};
Grammar.prototype.addR = function(grule) {
  this.R.push(grule);
};


////
// PARSING TABLE GENERATOR GUI
//////

var StatusClass = {
  INFO : "info",
  OK : "ok",
  ERROR : "error"
};

var PTGConfig = {
  FULL : "full",
  COMPACT : "compact"
};

var PTG = {

  inputG : undefined,
  k : undefined,
  config : undefined,

  run: function() {
    this.setInfo("Processing...");
    
    this.k = parseInt($("input[name=k]").val());
    if (isNaN(this.k) || this.k < 1 || this.k > 100) {
      this.setError("Error: Invalid k");
      return;
    }
    
    this.config = $("select[name=result]").val();
    if (this.config !== PTGConfig.FULL && this.config !== PTGConfig.COMPACT) {
      this.setError("Error: Invalid output selection");
      return;
    }
    
    this.inputG = $("textarea[name=grammar]").val();
    if (this.inputG.length === 0) {
      this.setError("Error: Empty input grammar");
      return;
    }
    
    ParserHandler.start();
    try {
      parser.parse(this.inputG);
    } catch (err) {
      this.setError("Error: Invalid input grammar (error on line "+err+")");
      return;
    }
    
    this.setOk("OK");
  },

  statusBar: undefined,
  setInfo: function(msg) {
    this.statusBar.text(msg);
    this.statusBar.attr("class", StatusClass.INFO);
  },
  setOk: function(msg) {
    this.statusBar.text(msg);
    this.statusBar.attr("class", StatusClass.OK);
  },
  setError: function(msg) {
    this.statusBar.text(msg);
    this.statusBar.attr("class", StatusClass.ERROR);
  }

};
$(function() {
  PTG.statusBar = $("#status span");
});


////
// CONTENT SELECT HELPER
//////

function select_all(el) {
  if (typeof window.getSelection !== "undefined" && 
      typeof document.createRange !== "undefined") {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.selection !== "undefined" && 
    typeof document.body.createTextRange !== "undefined") {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.select();
  }
}


////
// INPUT PARSER MODIFICATION
//////

parser.yy.parseError = function parseError(str, hash) {
    throw hash.line+1;
};


////
// INPUT PARSER HANDLER
//////

var PHStatus = {
  OK : 0,
  FAIL : 0
};

var PHState = {
    NONE : 0,
    TOKENDEF : 1
};

var ParserHandler = {
  
  IG : undefined,
  status : PHStatus.OK,
  state : PHState.NONE,
  
  start : function() {
    this.IG = new Grammar();
  },
  
  tryme : function(text) {
    alert(text);
  }
  
};