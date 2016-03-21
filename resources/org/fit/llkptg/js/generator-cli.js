/*!
 * LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */

/*!
 * Requires:
 * PTGIO
 * libs/lodash.min.js
 * parser.js
 * generator-core.js
 */


////
// LL(k) PARSING TABLE GENERATOR CLI
//////

// LL(k) Parsing Table Generator CLI Table Format
var PTGCLITableFormat = {
  EXTENDED : "extended",  // Extended LL(k) Parsing Table
  STANDARD : "standard"   // Standard LL(k) Parsing Table
};

// LL(k) Parsing Table Generator CLI Status
var PTGCLIStatus = {
  OK      : "ok",
  ERROR   : "error",
  WARNING : "warning"
};

// LL(k) Parsing Table Generator CLI
var PTGCLI = {  
  
  run: function() {
    this.setOk();
    if (!this.handleInputParse()) return;
    if (!this.handleInputSemanticErrors()) return;
    
    TableGenerator.construct(ParserHandler.IG, PTGIO.k);
    this.handleParsingTableErrors();
    if (PTGIO.tableFormat == PTGCLITableFormat.STANDARD) {
      PTGIO.output = PTGExport.sLLkPT(TableGenerator.PT);
      return;
    }
    
    ExtendedTableGenerator.construct(ParserHandler.IG, PTGIO.k, TableGenerator.PT);
    PTGIO.output = PTGExport.eLLkPT(ExtendedTableGenerator.EPT);
  },
  
  handleInputParse: function() {
    ParserHandler.start();
    try {
      parser.parse(PTGIO.inputG);
    } catch(err) {
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
      this.setWarning("Warning: The input is not an LL(k) grammar for k = "+PTGIO.k);
    }
  },
  
  setOk: function() {
    PTGIO.status = PTGCLIStatus.OK;
    PTGIO.msg = "";
  },
  setWarning: function(msg) {
    PTGIO.status = PTGCLIStatus.WARNING;
    PTGIO.msg = msg;
  },
  setError: function(msg) {
    PTGIO.status = PTGCLIStatus.ERROR;
    PTGIO.msg = msg;
  }
  
};



////
// OUTPUT EXPORTER
//////

// Output Exporter
var PTGExport = {
  
  prepElStr: function(array) {
    var text = "";
    if (array.length === 0)
      text = "ε";
    for (var i = 0; i < array.length; i++) {
      if (i === array.length-1)
        text += this.prepEl(array[i], true);
      else
        text += this.prepEl(array[i], false);
    }
    return text;
  },
          
  prepEl: function(gel, nospace) {
    var text = gel.value;
    return (nospace)? text : text+" ";
  },
  
  prepElStateStr: function(array) {
    var text = "";
    if (array.length === 0)
      text += "0";
    for (var i =0; i < array.length; i++) {
      text += array[i].value;
      if (i !== array.length-1)
        text += ":";
    }
    return text;
  },
  
  sLLkPT: function(spt) {
    var table = [];
    var row;
    
    // the head row
    row = [];
    row.push("");
    for (var i = 0; i < spt.si.length; i++) {
      var el = spt.si[i];
      if (el.type === PTSIType.STR)
        row.push(this.prepElStr(el.str));
      if (el.type === PTSIType.END)
        row.push("ε");
    }
    table.push(row);
    
    // the other rows
    for (var i = 0; i < spt.fi.length; i++) {
      row = [];
      var el = spt.fi[i];
      if (el.type === PTFIType.BOT) {
        row.push("$");
      } else {
        row.push(el.value);
      }
      for (var j = 0; j < spt.si.length; j++) {
        row.push(this.prepSCell(spt.field[i][j]));
      }
      table.push(row);
    }
    
    return table;
  },
  
  prepSCell: function(array) {
    var text = "";
    for (var i = 0; i < array.length; i++) {
      switch (array[i].type) {
        case PTEType.ACCEPT: 
          text += "accept"; 
          break;
        case PTEType.POP:
          text += "pop";
          break;
        case PTEType.EXPAND:
          text += this.prepElStr(array[i].str)+", ";
          text += array[i].rule.number;
          break;
      }
      if (i !== array.length-1)
        text += " | ";
    }
    return text;
  },
  
  eLLkPT: function(ept) {
    var table = [];
    var row;
    
    // the head row
    row = [];
    row.push("");
    for (var i = 0; i < ept.si.length; i++) {
      row.push(this.prepElStateStr(ept.si[i].str));
    }
    table.push(row);
    
    // the other rows
    for (var i = 0; i < ept.fi.length; i++) {
      row = [];
      var el = ept.fi[i];
      switch (el.type) {
        default:
          row.push(el.value);
          break;
        case EPTFIType.PBOT:
          row.push("#");
          break;
        case EPTFIType.IEND:
          row.push("$");
          break;
      }
      for (var j = 0; j < ept.si.length; j++) {
        row.push(this.prepECell(ept.field[i][j]));
      }
      table.push(row);
    }
    
    return table;
  },
  
  prepECell: function(array) {
    var text = "";
    for (var i = 0; i < array.length; i++) {
      switch (array[i].type) {
        case EPTEType.ACCEPT:
          text += "accept";
          break;
        case EPTEType.EXPAND:
          text += this.prepElStr(array[i].str)+", ";
          text += array[i].rule.number;
          break;
        case EPTEType.POP:
          text += "pop "+this.prepElStateStr(array[i].str);
          break;
        case EPTEType.CHANGE:
          text += this.prepElStateStr(array[i].str);
          break;
      }
      if (i !== array.length-1)
        text += " | ";
    }
    return text;
  }
  
};