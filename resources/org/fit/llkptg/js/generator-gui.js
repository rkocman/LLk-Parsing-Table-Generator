/*!
 * LL(k) Parsing Table Generator
 * https://github.com/rkocman/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */

/*!
 * Requires:
 * libs/lodash.min.js
 * parser.js
 * generator-core.js
 * libs/jquery-2.1.3.js
 * libs/excellentexport.js
 */


////
// COMMON FUNCTIONS
//////

// Select the whole content of an html element
// @param html element
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



////
// LL(k) PARSING TABLE GENERATOR GUI
//////

// LL(k) Parsing Table Generator GUI Status
var PTGStatus = {
  INFO  : "info",
  OK    : "ok",
  ERROR : "error"
};

// LL(k) Parsing Table Generator GUI Configuration
var PTGConfig = {
  FULL    : "full",
  COMPACT : "compact",
  EXPORT  : "export"
};

// LL(k) Parsing Table Generator GUI
var PTG = {

  // a form content
  inputG: undefined,
  k: undefined,
  config: undefined,

  statusBar: undefined,

  run: function() {
    this.setInfo("Processing...");
    out.clean();
    
    if (!this.handleInputForm()) return;
    
    // force redraw
    setTimeout(this.runAsync, 30);
  },
  
  runAsync: function() {
    if (!PTG.handleInputParse()) return;
    out.title("Parsed Rules");
    out.grammar(ParserHandler.IG);
    if (!PTG.handleInputSemanticErrors()) return;
    
    TableGenerator.construct(ParserHandler.IG, PTG.k);
    if (PTG.config === PTGConfig.FULL) {
      out.title("LL("+PTG.k+") Tables");
      for (var i = 0; i < TableGenerator.LLks.length; i++) {
        out.llkT(TableGenerator.LLks[i]);
      }
      
      out.title("Standard LL("+PTG.k+") Parsing Table");
      out.export("spt", "Standard LL("+PTG.k+") Parsing Table");
      out.sLLkPT(TableGenerator.PT);
    }
    
    ExtendedTableGenerator.construct(ParserHandler.IG, PTG.k, TableGenerator.PT);
    out.title("Extended LL("+PTG.k+") Parsing Table");
    out.export("ept", "Extended LL("+PTG.k+") Parsing Table");
    if (PTG.config === PTGConfig.EXPORT) {
      out.eLLkPT(ExtendedTableGenerator.EPT, true);
    } else {
      out.eLLkPT(ExtendedTableGenerator.EPT);
    }
    
    PTG.setOk("OK");
    PTG.handleParsingTableErrors();
  },
  
  handleInputForm: function() {
    this.k = parseInt($("input[name=k]").val());
    if (isNaN(this.k) || this.k < 1) {
      this.setError("Error: Invalid k");
      return false;
    }
    
    this.config = $("select[name=result]").val();
    if (this.config !== PTGConfig.FULL && 
        this.config !== PTGConfig.COMPACT &&
        this.config !== PTGConfig.EXPORT) {
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
        (a rule with the terminal "+ParserHandler.statusText+" on the left side)");
      return false;
    }
    
    if (ParserHandler.status === PHStatus.FAILRD) {
      this.setError("Error: Invalid input grammar \
        (duplicate rules for the nonterminal "+ParserHandler.statusText+")");
      return false;
    }
    
    if (ParserHandler.status === PHStatus.FAILRM) {
      this.setError("Error: Invalid input grammar \
        (a missing rule for the nonterminal "+ParserHandler.statusText+")");
      return false;
    }
    
    if (ParserHandler.status === PHStatus.FAILRL) {
      this.setError("Error: Invalid input grammar \
        (a left recursion with the nonterminal "+ParserHandler.statusText+")");
      return false;
    }
    
    return true;
  },
  
  handleParsingTableErrors: function() {
    if (TableGenerator.status === TGStatus.ERROR) {
      this.setError("Error: The input is not an LL(k) grammar for k = "+this.k);
    }
  },

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
// OUTPUT PRINTER
//////

// Output Printer
var out = {
  
  out: undefined,
  
  clean: function() {
    this.out.html("");
  },
  
  title: function(text) {
    var html = "<h2>"+text+"</h2>";
    this.out.append(html);
  },
  
  grammar: function(g) {
    var html = "<table class=\"gt\">";
    for (var i = 0; i < g.R.length; i++) {
      html += "<tr><td><span class=\"lbl\">("+g.R[i].number+")</span></td>";
      html += "<td>"+this.prepRule(g.R[i])+"</td></tr>";
    }
    html += "</table>";
    this.out.append(html);
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
  
  prepElStateStr: function(array) {
    var html = "<span class=\"state\">";
    if (array.length === 0)
      html += "0";
    for (var i = 0; i < array.length; i++) {
      html += array[i].value;
      if (i !== array.length-1)
        html += ":";
    }
    html += "</span>";
    return html;
  },
  
  llkT: function(t) {
    var html = "<table class=\"llkt\">";
    html += "<caption>Table "+t.name+" ( T<sub>";
    html += this.prepEl(t.N, true)+",{";
    for (var i = 0; i < t.L.length; i++) {
      html += this.prepElStr(t.L[i].str);
      if (i !== t.L.length-1)
        html += ", ";
    }
    html += "} </sub>)</caption>";
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
    this.out.append(html);
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
    var html = "<table id=\"spt\" class=\"spt\">";
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
    html += "<th> </th>";
    html += "</tr>";
    for (var i = 0; i < spt.fi.length; i++) {
      html += "<tr>";
      html += "<th>";
      if (spt.fi[i].type === PTFIType.N) {
        html += spt.fi[i].value;
      }
      if (spt.fi[i].type === PTFIType.T) {
        html += "<span class=\"t\">"+spt.fi[i].value+"</span>";
      }
      if (spt.fi[i].type === PTFIType.BOT) {
        html += "<span class=\"bot\">$</span>";
      }
      html += "</th>";
      for (var j = 0; j < spt.si.length; j++) {
        html += this.prepSCell(spt.field[i][j]);
      }
      html += "<th> </th>";
      html += "</tr>";
    }
    html += "</table>";
    this.out.append(html);
  },
  
  prepSCell: function(array) {
    var html = "";
    if (array.length > 1)
      html += "<td class=\"errorCell\">";
    else
      html += "<td>";
    for (var i = 0; i < array.length; i++) {
      switch (array[i].type) {
        case PTEType.ACCEPT: 
          html += "<span class=\"accept\">accept</span>";
          break;
        case PTEType.POP: 
          html += "<span class=\"pop\">pop</span>";
          break;
        case PTEType.EXPAND: 
          html += this.prepElStr(array[i].str)+", ";
          html += "<span class=\"lbl\">"+array[i].rule.number+"</span>";
          break;
      }
      html += "<br>";
    }
    html += "</td>";
    return html;
  },
  
  eLLkPT: function(ept, invis) {
    var html = "<table id=\"ept\" class=\"ept\"";
    if (invis)
      html += " style=\"display:none\"";
    html += ">";
    html += "<tr><th></th>";
    for (var i = 0; i < ept.si.length; i++) {
      html += "<th>";
      html += this.prepElStateStr(ept.si[i].str);
      html += "</th>";
    }
    html += "<th> </th>";
    html += "</tr>";
    for (var i = 0; i < ept.fi.length; i++) {
      if (ept.fi[i].type === EPTFIType.PBOT)
        html += "<tr class=\"sep\">";
      else
        html += "<tr>";
      html += "<th>";
      switch(ept.fi[i].type) {
        case EPTFIType.N:
          html += ept.fi[i].value;
          break;
        case EPTFIType.PT:
        case EPTFIType.IT:
          html += "<span class=\"t\">"+ept.fi[i].value+"</span>";
          break;
        case EPTFIType.PBOT:
          html += "<span class=\"bot\">#</span>";
          break;
        case EPTFIType.IEND:
          html += "<span class=\"eps\">$</span>";
          break;
      }
      html += "</th>";
      for (var j = 0; j < ept.si.length; j++) {
        html += this.prepECell(ept.field[i][j]);
      }
      html += "<th> </th>";
      html += "</tr>";
    }
    html += "</table>";
    this.out.append(html);
  },
  
  prepECell: function(array) {
    var html = "";
    if (array.length > 1)
      html += "<td class=\"errorCell\">";
    else
      html += "<td>";
    for (var i = 0; i < array.length; i++) {
      switch(array[i].type) {
        case EPTEType.ACCEPT:
          html += "<span class=\"accept\">accept</span>";
          break;
        case EPTEType.EXPAND:
          html += this.prepElStr(array[i].str)+", ";
          html += "<span class=\"lbl\">"+array[i].rule.number+"</span>";
          break;
        case EPTEType.POP: 
          html += "<span class=\"pop\">pop</span> ";
          html += this.prepElStateStr(array[i].str);
          break;
        case EPTEType.CHANGE:
          html += this.prepElStateStr(array[i].str);
          break;
      }
      html += "<br>";
    }
    html += "</td>";
    return html;
  },
  
  export: function(table, name) {
    var html = "<p class=\"export\">";
    html += "Export: ";
    html += "<a download=\""+table+".xls\" href=\"#\" "
      +"onclick=\"return ExcellentExport.excel(this, '"+table+"', '"+name+"');\">"
      +"XLS</a>, ";
    html += "<a download=\""+table+".csv\" href=\"#\" "
      +"onclick=\"return ExcellentExport.csv(this, '"+table+"');\">"
      +"CSV1</a>, ";
    html += "<a download=\""+table+".csv\" href=\"#\" "
      +"onclick=\"return ExcellentExport.csv(this, '"+table+"', ';');\">"
      +"CSV2</a>";
    html += "</p>";
    this.out.append(html);
  }
  
};
$(function() {
  out.out = $("#output");
});