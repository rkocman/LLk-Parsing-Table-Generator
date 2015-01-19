/*!
 * LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Author: Radim Kocman
 */


////
// COMMON
//////

function selectContent(el) {
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
};

function inArray(el, array) {
  return ($.inArray(el, array) === -1)? false : true;
};

function addToArray(el, array) {
  if (!inArray(el, array))
    array.push(el);
};

function addToArrayFlat(el, elf, array, arrayf) {
  if (!inArray(elf, arrayf)) {
    arrayf.push(elf);
    array.push(el);
  }
};


////
// GRAMMAR OBJECTS
//////

var GType = {
  T : 1, // terminal
  N : 2, // nonterminal
  
  A : 3, // abstract term
  V : 4  // value term
};

var GElement = function(value, type) {
  this.value = value;
  this.type = type;
};
GElement.prototype.isT = function() {
  return (this.type === GType.T)? true : false;
};
GElement.prototype.isN = function() {
  return (this.type === GType.N)? true : false;
};

var GRule = function() {
  this.left;
  this.right = [];
};
GRule.prototype.setLeft = function(gel) {
  this.left = gel;
};
GRule.prototype.addRight = function(gel) {
  this.right.push(gel);
};

var Grammar = function() {
  this.N = [];        // nonterminals
  this.Nf = [];         // only values
  this.T = [];        // terminals
  this.Tf = [];         // only values
  this.R = [];        // rules  
  this.S = undefined; // starting nonterminal
};
Grammar.prototype.addT = function(gel) {
  addToArrayFlat(gel, gel.value, this.T, this.Tf);
};
Grammar.prototype.addR = function(grule) {
  this.R.push(grule);
};
Grammar.prototype.parseR = function() {
  // Set S
  this.S = this.R[0].left;
  
  // Fill N and T
  var grulei, gelj;
  for (var i = 0; i < this.R.length; i++) {
    grulei = this.R[i];
    
    addToArrayFlat(grulei.left, grulei.left.value, this.N, this.Nf);
    
    for (var j = 0; j < grulei.right.length; j++) {
      gelj = grulei.right[j];
      
      if (gelj.isN()) addToArrayFlat(gelj, gelj.value, this.N, this.Nf);
      if (gelj.isT()) addToArrayFlat(gelj, gelj.value, this.T, this.Tf);
    }
  }
};


////
// PARSING TABLE GENERATOR GUI
//////

var PTGStatus = {
  INFO  : "info",
  OK    : "ok",
  ERROR : "error"
};

var PTGConfig = {
  FULL    : "full",
  COMPACT : "compact"
};

var PTG = {

  // form
  inputG : undefined,
  k : undefined,
  config : undefined,

  run: function() {
    this.setInfo("Processing...");
    out.clean();
    
    if (!this.handleInputForm()) return;
    
    if (!this.handleInputParse()) return;
    if (this.config === PTGConfig.FULL ||
        ParserHandler.status !== PHStatus.OK) {
      out.title("Parsed Rules");
      out.grammar(ParserHandler.IG);
    }
    if (!this.handleInputSemanticErrors()) return;
    
    TableGenerator.construct(ParserHandler.IG, this.k);
    if (this.config === PTGConfig.FULL) {
      out.title("LL("+this.k+") Tables");
      for (var i = 0; i < TableGenerator.LLks.length; i++) {
        out.llkT(TableGenerator.LLks[i]);
      }
      
      out.title("Standard LL("+this.k+") Parsing Table");
      out.sLLkPT(TableGenerator.PT);
    }
    
    this.setOk("OK");
  },
  
  handleInputForm: function() {
    this.k = parseInt($("input[name=k]").val());
    if (isNaN(this.k) || this.k < 1 || this.k > 100) {
      this.setError("Error: Invalid k");
      return false;
    }
    
    this.config = $("select[name=result]").val();
    if (this.config !== PTGConfig.FULL && this.config !== PTGConfig.COMPACT) {
      this.setError("Error: Invalid output selection");
      return false;
    }
    
    this.inputG = $("textarea[name=grammar]").val();
    if (this.inputG.length === 0) {
      this.setError("Error: Empty input grammar");
      return false;
    }
    
    return true;
  },
  
  handleInputParse: function() {
    ParserHandler.start();
    try {
      parser.parse(this.inputG);
    } catch (err) {
      this.setError("Error: Invalid input grammar (error on line "+err+")");
      return false;
    }
      
    return true;
  },
  
  handleInputSemanticErrors: function() {
    if (ParserHandler.status === PHStatus.FAILN) {
      this.setError("Error: Invalid input grammar \
        (rule with terminal "+ParserHandler.statusText+" on the left side)");
      return false;
    }
    
    if (ParserHandler.status === PHStatus.FAILRD) {
      this.setError("Error: Invalid input grammar \
        (duplicate rules for nonterminal "+ParserHandler.statusText+")");
      return false;
    }
    
    if (ParserHandler.status === PHStatus.FAILRM) {
      this.setError("Error: Invalid input grammar \
        (missing rule for nonterminal "+ParserHandler.statusText+")");
      return false;
    }
    
    if (ParserHandler.status === PHStatus.FAILRL) {
      this.setError("Error: Invalid input grammar \
        (left recursion with nonterminal "+ParserHandler.statusText+")");
      return false;
    }
    
    return true;
  },

  statusBar: undefined,
  setInfo: function(msg) {
    this.statusBar.text(msg);
    this.statusBar.attr("class", PTGStatus.INFO);
  },
  setOk: function(msg) {
    this.statusBar.text(msg);
    this.statusBar.attr("class", PTGStatus.OK);
  },
  setError: function(msg) {
    this.statusBar.text(msg);
    this.statusBar.attr("class", PTGStatus.ERROR);
  }

};
$(function() {
  PTG.statusBar = $("#status span");
});


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
  OK      : 0,
  FAILN   : 1, // Fail terminal 
  FAILRD  : 2, // Duplicate rule
  FAILRM  : 3, // Missing rule
  FAILRL  : 4  // Left recursive rule
};

var ParserHandler = {
  
  IG : undefined,
  status : PHStatus.OK,
  statusText : "",
  halves : undefined,
  
  start : function() {
    this.IG = new Grammar();
    this.status = PHStatus.OK;
    this.statusText = "";
    this.halves = [];
  },
  
  setT : function(array) {
    var geli;
    for (var i = 0; i < array.length; i++) {
      geli = array[i];
      
      geli.type = GType.T;
      this.IG.addT(geli);
    }
  },
  
  convert : function(gel) {
    if (gel.type === GType.V) {
      gel.type = GType.T;
      return gel;
    }
    
    if (inArray(gel.value, this.IG.Tf)) {
      gel.type = GType.T;
      return gel;
    }
    
    gel.type = GType.N;
    return gel;
  },
  
  setHalfR : function(right) {
    var grule = new GRule();
    for (var i = 0; i < right.length; i++) {
      var gel = this.convert(right[i]);
      grule.addRight(gel);
    }
    this.halves.push(grule);
  },
  
  setR : function(left, right) {
    var lgel = this.convert(left);
    
    // Test nonterminal on the left side
    if (lgel.type === GType.T) {
      this.status = PHStatus.FAILN;
      this.statusText = lgel.value;
    }
    
    // Rule
    var grule = new GRule();
    grule.setLeft(lgel);
    for (var i = 0; i < right.length; i++) {
      var el = this.convert(right[i]);
      grule.addRight(el);
    }
    this.IG.addR(grule);
    
    // Finish halves
    for (var i = this.halves.length-1; i >= 0; i--) {
      grule = this.halves[i];
      grule.setLeft(lgel);
      this.IG.addR(grule);
    }
    this.halves = [];
  },
  
  finish : function() { 
    if (this.status !== PHStatus.OK) return;
    
    // Test duplicate rules
    if (!this.testDuplicate()) return;
    
    // Test nonterminals without rules
    if (!this.testMissing()) return;
    
    // Test left recursion
    this.testLeftRecursion();
    
    // Parse rules
    this.IG.parseR();
    
  },
  
  testDuplicate : function() {
    var grulei, grulej, same;
    for (var i = 0; i < this.IG.R.length; i++) {
      grulei = this.IG.R[i];
      
      for (var j = 0; j < this.IG.R.length; j++) {
        grulej = this.IG.R[j];
        
        if (i === j) continue;
        if (grulei.left.value !== grulej.left.value) continue;
        if (grulei.right.length !== grulej.right.length) continue;
        
        same = true;
        for (var k = 0; k < grulei.right.length; k++) {
          if (grulei.right[k].value !== grulej.right[k].value) same = false;
        }
        if (same) { 
          this.status = PHStatus.FAILRD;
          this.statusText = grulei.left.value;
          return false;
        }
      }
    }
    return true;
  },
  
  testMissing : function() {
    var grulei, gelj, found;
    var onleft = [];
    var onright = [];
    
    // fill arrays
    for (var i = 0; i < this.IG.R.length; i++) {
      grulei = this.IG.R[i];
      onleft.push(grulei.left.value);
      
      for (var j = 0; j < grulei.right.length; j++) {
        gelj = grulei.right[j];
        if (gelj.isN())
          onright.push(gelj.value);
      }
    }
    
    // check for missing
    for (var i = 0; i < onright.length; i++) {
      found = false;
      for (var j = 0; j < onleft.length; j++) {
        if (onright[i] === onleft[j]) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.status = PHStatus.FAILRM;
        this.statusText = onright[i];
        return false;
      }
    }
    
    return true;
  },
  
  prepareEmptySet : function() {
    var grulei, gelj;
    var olds = [];
    var news = [];
    
    do {
      olds = news;
      news = [];
      
      for (var i = 0; i < this.IG.R.length; i++) {
        grulei = this.IG.R[i];
        
        // count rules with eps
        if (grulei.right.length === 0) {
          news.push(grulei.left.value);
          continue;
        }
        
        // count rules with all eps nonterminals
        for (var j = 0; j < grulei.right.length; j++) {
          gelj = grulei.right[j];
          
          if (gelj.isT()) 
            break;
          
          if (inArray(gelj.value, olds)) {
            if (j !== grulei.right.length-1)
              continue;
            else
              news.push(grulei.left.value);
          }
          
          break;
        }
      }
      
    } while (olds.length !== news.length);
    
    return news;
  },
  
  testLeftRecursion : function() {
    var grulei, gelj;
    var empty = this.prepareEmptySet();
    
    for (var i = 0; i < this.IG.R.length; i++) {
      grulei = this.IG.R[i];
      
      for (var j = 0; j < grulei.right.length; j++) {
        gelj = grulei.right[j];
        
        if (gelj.isT()) break;
        
        this.testLeftRecusion_cont([], gelj.value, empty);
        
        if (!inArray(gelj.value, empty)) break;
      }
    }
  },
  
  testLeftRecusion_cont : function(before, current, empty) {
    var grulei, gelj;
    
    if (inArray(current, before)) {
      this.status = PHStatus.FAILRL;
      this.statusText = current;
      return;
    }
    
    before = before.concat([current]);
    
    for (var i = 0; i < this.IG.R.length; i++) {
      grulei = this.IG.R[i];
      
      if (grulei.left.value !== current) continue;
      
      for (var j = 0; j < grulei.right.length; j++) {
        gelj = grulei.right[j];
        
        if (gelj.type === GType.T) break;
        
        this.testLeftRecusion_cont(before, gelj.value, empty);
        
        if (!inArray(gelj.value, empty)) break;
      }
    }
  }
  
};


////
// OUTPUT PRINTER
//////

var out = {
  
  out: undefined,
  
  clean: function() {
    this.out.html("");
  },
  
  title: function(text) {
    var html = "<h2>"+text+"</h2>";
    this.out.html(this.out.html() + html);
  },
  
  grammar: function(g) {
    var html = "<div class=\"code2\">";
    for (var i = 0; i < g.R.length; i++) {
      html += this.prepRule(g.R[i])+"<br>";
    }
    html += "</div>";
    this.out.html(this.out.html() + html);
  },
  
  prepRule: function(grule) {
    var html = 
      this.prepEl(grule.left)+ "→ ";
    html += this.prepElStr(grule.right);
    return html;
  },
  
  prepElStr: function(array) {
    var html = "";
    if (array.length === 0)
      html += "<span class=\"eps\">ε</span>";
    for (var i = 0; i < array.length; i++) {
      if (i === array.length-1)
        html += this.prepEl(array[i], true);
      else
        html += this.prepEl(array[i], false);
    }
    return html;
  },
  
  prepEl: function(gel, nospace) {
    var html = 
      "<span class=\""+((gel.isN())?"n":"t")+"\">"
      +gel.value+"</span>"+((nospace)? "" : " ");
    return html; 
  },
  
  llkT: function(t) {
    var html = "<table class=\"llkt\">";
    html += "<caption>Table T<sub>"+t.number+"</sub> (T<sub>";
    html += this.prepEl(t.N, true)+",{";
    html += this.prepElStr(t.L.str);
    html += "}</sub>)</caption>";
    html += "<tr><th>u</th><th>Production</th><th>Follow</th></tr>";
    var rowi, folj;
    for (var i = 0; i < t.rows.length; i++) {
      rowi = t.rows[i];
      
      html += "<tr><td>";
      html += this.prepElStr(rowi.u.str);
      
      html += "</td><td>"+this.prepRule(rowi.prod)+"</td><td>";
      
      if (rowi.follow.length === 0)
        html += "<span class=\"emptyf\">-</span>";
      for (var j = 0; j < rowi.follow.length; j++) {
        folj = rowi.follow[j];
        html += this.prepFollow(folj);
        if (j !== rowi.follow.length-1)
          html += ", ";
      }
      html += "</td></tr>";
    }
    html += "</table>";
    this.out.html(this.out.html() + html);
  },
  
  prepFollow: function(f) {
    var html =
      this.prepEl(f.N, true)+":{";
    for (var i = 0; i < f.sets.length; i++) {
      html += this.prepElStr(f.sets[i].str);
      if (i !== f.sets.length-1) html += ", ";
    }
    html += "}";
    return html;
  },
  
  sLLkPT: function(spt) {
    var html = "<table class=\"spt\">";
    html += "<tr><th></th>";
    for (var i = 0; i < spt.si.length; i++) {
      if (spt.si[i].type === PTSIType.STR) {
        html += "<th>";
        html += this.prepElStr(spt.si[i].str);
        html += "</th>";
      }
      if (spt.si[i].type === PTSIType.END) {
        html += "<th><span class=\"eps\">ε</span></th>";
      }
    }
    html += "<th> </th>"
    html += "</tr>";
    for (var i = 0; i < spt.fi.length; i++) {
      html += "<tr>";
      html += "<th>";
      if (spt.fi[i].type === PTFIType.N) {
        html += "T<sub>"+spt.fi[i].number+"</sub>";
      }
      if (spt.fi[i].type === PTFIType.T) {
        html += "<span class=\"t\">"+spt.fi[i].value+"</span>";
      }
      if (spt.fi[i].type === PTFIType.BOT) {
        html += "<span class=\"eps\">$</span>";
      }
      html += "</th>";
      for (var j = 0; j < spt.si.length; j++) {
        html += this.prepCell(spt.field[i][j]);
      }
      html += "</tr>";
    }
    html += "</table>";
    this.out.html(this.out.html() + html);
  },
  
  prepCell: function(array) {
    var html = "<td></td>";
    return html;
  }
  
};
$(function() {
  out.out = $("#output");
});


////
// LL(k) PARSING TABLE GENERATOR
//////

var FollowEl = function(N, sets) {
  this.N = N;
  this.sets = sets;
};

var LLkTRow = function(u, grule, F) {
  this.u = u;
  this.prod = grule;
  this.follow = F;
};

var LLkT = function(count, A, L) {
  this.name = "T"+count;
  this.number = count;
  
  this.N = A;
  this.L = L;
  
  this.rows = [];
};
LLkT.prototype.addRow = function(ltrow) {
  this.rows.push(ltrow);
};
LLkT.prototype.toFlat = function() {
  var flat = "T:"+this.N.value+",{";
  for (var i = 0; i < this.L.str.length; i++) {
    flat += this.L.str[i].value;
    if (i !== this.L.str.length-1)
      flat += ":";
  }
  flat += "}";
  return flat;
};

var FirstKEl = function(k) {
  this.leftk = k;
  this.k = 0;
  this.str = [];
};
FirstKEl.prototype.addGEl = function(gel) {
  this.leftk--;
  this.k++;
  this.str.push(gel);
};
FirstKEl.prototype.clone = function() {
  return jQuery.extend(true, {}, this);
};
FirstKEl.prototype.toFlat = function() {
  var flat = "";
  for (var i = 0; i < this.str.length; i++) {
    flat += this.str[i].value;
    if (i !== this.str.length-1)
      flat += ":";
  }
  return flat;
};

var PTEType = {

};

var PTEl = function(type) {
  this.type = type;
};

var PTFIType = {
  N   : 1, // nonterminal
  T   : 2, // terminal
  BOT : 3  // bottom of pushdown
};

var PTFirstIn = function(type, value, number) {
  this.type = type;
  this.value = value;
  this.number = number;
};
PTFirstIn.prototype.toFlat = function() {
  var flat;
  switch(this.type) {
    case PTFIType.N: flat = this.value; break;
    case PTFIType.T: flat = ":"+this.value; break;
    case PTFIType.BOT: flat = "|$"; break;
  };
  return flat;
};

PTSIType = {
  STR : 1, // terminals
  END : 2  // end of input
};

var PTSecondIn = function(type, str) {
  this.type = type;
  this.str = str;
};
PTSecondIn.prototype.toFlat = function() {
  var flat = "";
  switch(this.type) {
    case PTSIType.STR:
      for (var i = 0; i < this.str.length; i++) {
        flat += this.str[i].value;
        if (i !== this.str.length-1)
          flat += ":";
      }
      break;
    case PTSIType.END: flat = "|eps"; break;
  };
  return flat;
};

var ParsingTable = function() {
  this.fi = [];  // first index
  this.fif = [];   // only values
  this.si = [];  // second index
  this.sif = [];   // only values
  
  this.field = [];
};
ParsingTable.prototype.init = function(T, Tcounter, k) {
  // first index
  var nfi;
  for (var i = 0; i < Tcounter; i++) {
    nfi = new PTFirstIn(PTFIType.N, "T"+i, i);
    this.fi.push(nfi);
    this.fif.push(nfi.toFlat());
  }
  for (var i = 0; i < T.length; i++) {
    nfi = new PTFirstIn(PTFIType.T, T[i].value);
    this.fi.push(nfi);
    this.fif.push(nfi.toFlat());
  }
  nfi = new PTFirstIn(PTFIType.BOT);
  this.fi.push(nfi);
  this.fif.push(nfi.toFlat());
  
  // second index
  var nsi;
  var ins = [];
  for (var ki = 0; ki < k; ki++) {
    ins[ki] = 0;
  }
  while (ins[0] < T.length) {
    nsi = new PTSecondIn(PTSIType.STR, []);
    for (var ki = 0; ki < k; ki++) {
      if (ins[ki] < T.length)
        nsi.str.push(T[ins[ki]]);
    }
    ins[k-1]++;
    for (var ki = k-1; ki >=0 ; ki--) {
      if (ins[ki] > T.length) {
        ins[ki-1]++;
        ins[ki] = 0;
      }
    }
    addToArrayFlat(nsi, nsi.toFlat(), this.si, this.sif);
  }
  nfi = new PTSecondIn(PTSIType.END);
  this.si.push(nfi);
  this.sif.push(nfi.toFlat());
  
  // fields
  for (var i = 0; i < this.fi.length; i++) {
    this.field[i] = [];
    for (var j = 0; j < this.si.length; j++) {
      this.field[i][j] = [];
    }
  }
};

var TableGenerator = {
  
  IG: undefined,
  k : undefined,
  
  Tcounter: 0,
  
  LLks: [],
  PT: undefined,
  
  construct: function(IG, k) {
    this.IG = IG;
    this.k = k;
    this.Tcounter = 0;
    this.LLks = [];
    this.PT = new ParsingTable();
    
    this.constructLLkTs();
    
    this.PT.init(this.IG.T, this.Tcounter, this.k);
    
    //(...)
  },
  
  constructLLkTs: function() {
    //(1)
    var t0 = this.constructLLkT(this.IG.S, new FirstKEl(this.k));
    this.LLks.push(t0);
    
    //(2)
    var J = [t0.toFlat()];
    
    //(3)(4)
    var tabi, rowj, folk, setl, newt, newtf;
    for (var i = 0; i < this.LLks.length; i++) {
      tabi = this.LLks[i];
      for (var j = 0; j < tabi.rows.length; j++) {
        rowj = tabi.rows[j];
        for (var k = 0; k < rowj.follow.length; k++) {
          folk = rowj.follow[k];
          for (var l = 0; l < folk.sets.length; l++) {
            setl = folk.sets[l];
            
            newt = new LLkT(0, folk.N, setl);
            newtf = newt.toFlat();
            if (!inArray(newtf, J)) {
              newt = this.constructLLkT(folk.N, setl);
              this.LLks.push(newt);
              J.push(newtf);
            }
          }
        }
      }
    }
  },
  
  constructLLkT: function(N, L) {
    var table = new LLkT(this.Tcounter, N, L);
    this.Tcounter++;
    
    var first, setu, rulei, ltrow, follow;
    for (var i = 0; i < this.IG.R.length; i++) {
      rulei = this.IG.R[i];
      
      // skip irrelevant rules
      if (rulei.left.value !== N.value) continue;
      
      // compute u
      first = this.firstOp(rulei.right);
      setu = this.firstPlusOp(first, [L]);
      
      // compute follow
      follow = this.followOp(rulei.right, L);
      
      // add rows
      for (var j = 0; j < setu.length; j++) {
        ltrow = new LLkTRow(setu[j], rulei, follow);
        table.addRow(ltrow);
      }
    }
    
    return table;
  },
  
  firstOp: function(right) {
    var set = [new FirstKEl(this.k)];
    var set2 = [];
    
    for (var i = 0; i < right.length; i++) {
      for (var j = 0; j < set.length; j++) {
        
        // only uncomplete
        if (set[j].leftk <= 0) {
          set2.push(set[j]);
          continue;
        }
        
        // add terminals
        if (right[i].isT()) {
          set[j].addGEl(right[i]);
          set2.push(set[j]);
          continue;
        }
        
        // expand nonterminals
        set2 = set2.concat(this.firstOp_exp(set[j], right[i]));
        
      }
      set = set2;
      set2 = [];
    }
    
    return set;
  },
  
  firstOp_exp: function(el, N) {
    var set = [el.clone()];
    var set2 = [];
    var set3 = [];
    
    for (var r = 0; r < this.IG.R.length; r++) {
      var cr = this.IG.R[r];
      
      // skip irrelevant rules
      if (cr.left.value !== N.value) continue;
      
      for (var i = 0; i < cr.right.length; i++) {
        for (var j = 0; j < set.length; j++) {
          
          // only uncomplete
          if (set[j].leftk <= 0) {
            set2.push(set[j]);
            continue;
          }
          
          // add terminals
          if (cr.right[i].type === GType.T) {
            set[j].addGEl(cr.right[i]);
            set2.push(set[j]);
            continue;
          }
          
          // expand nonterminals
          set2 = set2.concat(this.firstOp_exp(set[j], cr.right[i]));
          
        }
        set = set2;
        set2 = [];
      }
      
      set3 = set3.concat(set);
      set = [el.clone()];
      set2 = [];
    }
    
    return set3;
  },
  
  firstPlusOp: function(set1, set2) {
    var ip, jp, fel;
    var result = [];
    var resultcheck = [];
    
    for (var i = 0; i < set1.length; i++) {
      for (var j = 0; j < set2.length; j++) {
        
        ip = 0; jp = 0; fel = new FirstKEl(this.k);
        for (var k = 0; k < this.k; k++) {
          if (ip < set1[i].str.length) {
            fel.addGEl(set1[i].str[ip]);
            ip++;
            continue;
          }
          if (jp < set2[j].str.length) {
            fel.addGEl(set2[j].str[jp]);
            jp++;
            continue;
          }
          break;
        }
        addToArrayFlat(fel, fel.toFlat(), result, resultcheck);
        
      }
    }
    
    return result;
  },
  
  followOp: function(right, L) {
    var result = [];
    var geli, rest, follow;
    var first, setu;
    
    for (var i = 0; i < right.length; i++) {
      geli = right[i];
      
      // skip terminals
      if (geli.isT()) continue;
      
      // create rest
      rest = [];
      for (var j = i+1; j < right.length; j++) {
        rest.push(right[j]);
      }
      
      // compute u
      first = this.firstOp(rest);
      setu = this.firstPlusOp(first, [L]);
      
      // add to result
      follow = new FollowEl(geli, setu);
      result.push(follow);
    }
    
    return result;
  }
  
};