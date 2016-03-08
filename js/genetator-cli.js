/*!
 * LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */

/*!
 * Requires:
 * libs/lodash.min.js
 * parser.js
 * generator-core.js
 */


////
// LL(k) PARSING TABLE GENERATOR CLI
//////

// LL(k) Parsing Table Generator CLI Output Table
var PTGCLIOutputTable = {
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
  
  // input variables
  inputG: "",
  k: 2,
  outputTable: PTGCLIOutputTable.EXTENDED,
  
  // output variables
  output: undefined,
  status: PTGCLIStatus.OK,
  msg: "",
  
  run: function() {
    this.setOk();
    if (!this.handleInputParse()) return;
    if (!this.handleInputSemanticErrors()) return;
    
    TableGenerator.construct(ParserHandler.IG, this.k);
    this.handleParsingTableErrors();
    if (this.outputTable === PTGCLIOutputTable.STANDARD) {
      this.output = TableGenerator.PT;
      return;
    }
    
    ExtendedTableGenerator.construct(ParserHandler.IG, this.k, TableGenerator.PT);
    this.output = ExtendedTableGenerator.EPT;
  },
  
  handleInputParse: function() {
    ParserHandler.start();
    try {
      parser.parse(this.inputG);
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
      this.setWarning("Error: The input is not an LL(k) grammar for k = "+this.k);
    }
  },
  
  setOk: function() {
    this.status = PTGCLIStatus.OK;
    this.msg = "";
  },
  setWaring: function(msg) {
    this.status = PTGCLIStatus.WARNING;
    this.msg = msg;
  },
  setError: function(msg) {
    this.status = PTGCLIStatus.ERROR;
    this.msg = msg;
  }
  
};