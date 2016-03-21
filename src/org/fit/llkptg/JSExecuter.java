/*!
 * LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */
package org.fit.llkptg;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.Scanner;
import javax.script.Bindings;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

/**
 * Handles the execution of the core algorithm in the JS engine.
 */
public class JSExecuter {
  
  // status
  private boolean statusOk;
  public boolean isOk() {return statusOk;}
  
  // JS engine
  private ScriptEngine engine;
  private Bindings bindings;
  private JSIO jsio;
  
  /**
   * Creates a new JSExecuter.
   */
  public JSExecuter() {
    statusOk = true;
    
    // prepare the JS engine
    engine = new ScriptEngineManager().getEngineByExtension("js");
    if (engine == null) {
      System.err.println("Cannot initialize the javascript engine.");
      statusOk = false;
      return;
    }
    bindings = engine.getBindings(ScriptContext.ENGINE_SCOPE);
    
    // bind JSIO
    jsio = new JSIO();
    bindings.put("PTGIO", jsio);
    
    // load scripts
    loadScript("/org/fit/llkptg/js/libs/lodash.min.js");
    loadScript("/org/fit/llkptg/js/parser.js");
    loadScript("/org/fit/llkptg/js/generator-core.js");
    loadScript("/org/fit/llkptg/js/generator-cli.js");
  }
  
  /**
   * Loads a resource script into the engine.
   * @param resName resource script name
   */
  private void loadScript(String resName) {
    if (!statusOk) return;
    InputStream is = getClass().getResourceAsStream(resName);
    Reader r = new InputStreamReader(is);
    try {
      engine.eval(r);
    } catch (ScriptException ex) {
      //Logger.getLogger(JSExecuter.class.getName()).log(Level.SEVERE, null, ex);
      System.err.println("Cannot properly execute javascript.");
      statusOk = false;
    }
  }
  
  /**
   * Computes the LL(k) parsing table.
   * @param inputG input grammar
   * @param k size of k
   * @param t table format
   */
  public void computeParsingTable(InputStream inputG, int k, SettingsTableFormat t) {
    
    // read the grammar
    String grammar = new Scanner(inputG).useDelimiter("\\A").next();
    jsio.setInputG(grammar);
    
    // set k
    jsio.setK(k);
    
    // set the table format
    jsio.setTableFormat(t);
    
    // compute the parsing table
    try {
      engine.eval("PTGCLI.run();");
    } catch (ScriptException ex) {
      //Logger.getLogger(JSExecuter.class.getName()).log(Level.SEVERE, null, ex);
      System.err.println("Cannot properly execute javascript.");
      statusOk = false;
    }
    
    // handle the resulting status
    switch (jsio.getStatus()) {
      default: break;
      case "error":   statusOk = false; // + warning
      case "warning": System.err.println(jsio.getMsg());
    }
  }
  
  /**
   * Returns the resulting LL(k) parsing table.
   * @return resulting table in the form String[][]
   */
  public String[][] getResult() {
    ScriptObjectMirror output = (ScriptObjectMirror) jsio.getOutput();
    String[][] table = output.to(String[][].class);
    return table;
  }
  
}
