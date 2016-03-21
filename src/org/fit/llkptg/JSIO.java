/*!
 * LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */
package org.fit.llkptg;

/**
 * Provides the input/outup binding between Java and JS.
 */
public class JSIO {
  
  // Input variables
  
  // grammar
  private String inputG;
  public String getInputG() {return inputG;}
  public void setInputG(String inputG) {this.inputG = inputG;}
  
  // k
  private int k;
  public int getK() {return k;}
  public void setK(int k) {this.k = k;}
  
  // table format
  private String tableFormat;
  public String getTableFormat() {return tableFormat;}
  public void setTableFormat(SettingsTableFormat tableFormat) {
    if (tableFormat == SettingsTableFormat.extended) this.tableFormat = "extended";
    if (tableFormat == SettingsTableFormat.standard) this.tableFormat = "standard";
  }
  
  // Output variable
  
  // output
  private Object output;
  public Object getOutput() {return output;}
  public void setOutput(Object output) {this.output = output;}
  
  // status
  private String status;
  public String getStatus() {return status;}
  public void setStatus(String status) {this.status = status;}
  
  // message
  private String msg;
  public String getMsg() {return msg;}
  public void setMsg(String msg) {this.msg = msg;}
  
}
