/*!
 * LL(k) Parsing Table Generator
 * https://github.com/rkocman/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */
package org.fit.llkptg;

import java.io.IOException;

/**
 * LL(k) Parsing Table Generator CLI.
 */
public class PTGCLI {

  /**
   * Main.
   * @param args the command line arguments
   */
  public static void main(String[] args) {
    
    Settings settings = new Settings();
    try {
      
      // handle the arguments
      if (!settings.handleArgs(args)) return;

      // prepare the JS engine
      JSExecuter jse = new JSExecuter();
      if (!jse.isOk()) return;

      // compute the parsing table
      jse.computeParsingTable(
        settings.getInput(), settings.getK(), settings.getTableFormat());
      if (!jse.isOk()) return;

      // print the result
      OutputPrinter printer = new OutputPrinter();
      printer.print(
        settings.getOutput(), jse.getResult(), settings.getOutputFormat());
    
    } finally {
      // clean
      try {settings.getInput().close();} catch (IOException e) {}
      try {settings.getOutput().close();} catch (IOException e) {}
    }
    
  }
  
}
