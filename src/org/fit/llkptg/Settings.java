/*!
 * LL(k) Parsing Table Generator
 * https://github.com/rkocman/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */
package org.fit.llkptg;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import org.kohsuke.args4j.CmdLineException;
import org.kohsuke.args4j.CmdLineParser;
import org.kohsuke.args4j.Option;

/**
 * Settings for the PTGCLI.
 */
public class Settings {
  
  // input
  @Option(name = "-i", aliases = { "--input" },
    usage = "input (default: standard input)")
  private File inputFile;
  private InputStream input = System.in;
  public InputStream getInput() {return input;}
  
  // output
  @Option(name = "-o", aliases = { "--output" },
    usage = "output (default: standard output)")
  private File outputFile;
  private OutputStream output = System.out;
  public OutputStream getOutput() {return output;}
  
  // size of k
  @Option(name = "-k",
    usage = "size of k >= 1 (default: 2)")
  private int k = 2;
  public int getK() {return k;}
  
  // table format
  @Option(name = "-t", aliases = { "--table" },
    usage = "table format (default: extended)")
  private SettingsTableFormat t = SettingsTableFormat.extended;
  public SettingsTableFormat getTableFormat() {return t;}
  
  // output format
  @Option(name = "-f", aliases = { "--format" },
    usage = "output format (default: csv1)")
  private SettingsOutputFormat f = SettingsOutputFormat.csv1;
  public SettingsOutputFormat getOutputFormat() {return f;}
  
  // help
  @Option(name = "--help", help = true,
    usage = "display this help and exit")
  private boolean help;
  
  
  // argument parser
  private CmdLineParser parser;
  
  
  /**
   * Handles the command line arguments.
   * @param args the command line arguments
   * @return Valid? true|false
   */
  public boolean handleArgs(String[] args) {
    parser = new CmdLineParser(this);
    
    try {
      parser.parseArgument(args);
    } catch (CmdLineException e) {
      System.err.println(e.getMessage());
      printTryHelp();
      return false;
    }
    
    if (inputFile != null) {
      try {
        input = new FileInputStream(inputFile);
      } catch (FileNotFoundException ex) {
        System.err.println("Cannot read from the input file.");
        return false;
      }
    }
    
    if (outputFile != null) {
      try {
        output = new FileOutputStream(outputFile);
      } catch (FileNotFoundException ex) {
        System.err.println("Cannot write into the output file.");
        return false;
      }
    }
    
    if (k < 1) {
      System.err.println("Numbers less than 1 are not valid values for \"-k\".");
      printTryHelp();
      return false;
    }
    
    if (help == true) {
      printHelp(System.out);
      return false;
    }
    
    return true;
  }
  
  /**
   * Prints the try help text.
   */
  private void printTryHelp() {
    System.err.println("Try '--help' for more information.");
  }
  
  /**
   * Prints the help text.
   * @param out where to print
   */
  private void printHelp(PrintStream out) {
    out.println("usage: llkptg [options...]");
    out.println("LL(k) Parsing Table Generator "
               +"for Automaton with One-Symbol Reading Head");
    //parser.printUsage(out);
    out.println(" -i (--input) FILE                : input (default: standard input)");
    out.println(" -k N                             : size of k >= 1 (default: 2)");
    out.println(" -t (--table) [extended|standard] : table format (default: extended)");
    out.println(" -o (--output) FILE               : output (default: standard output)");
    out.println(" -f (--format) [csv1|csv2]        : output format (default: csv1)");
    out.println(" --help                           : display this help and exit");
    out.println();
    out.println("Table Formats:");
    out.println("- extended - Extended LL(k) Parsing Table");
    out.println("- standard - Standard LL(k) Parsing Table");
    out.println();
    out.println("Output Formats:");
    out.println("- csv1 - CSV format comma-separated");
    out.println("- csv2 - CSV format semicolon-separated");
    out.println();
    out.println("Hints:");
    out.println("This tool uses simplified yacc-like syntax for its input:");
    out.println("- rules - can be defined as in yacc but without actions");
    out.println("- nonterminals - defined in the form [_a-Z][_a-Z0-9]*");
    out.println("- abstract terminals - same as nonterminals but declared");
    out.println("  by %token at the beginning");
    out.println("- literal terminals - anything inside quotes or apostrophes");
    out.println("  (escape sequences are not supported)");
    out.println("- comments - C-like single-line // and multi-line /**/");
    out.println();
    out.println("Example Input Grammar:");
    out.println("%token a b");
    out.println("%% /* LL(2) */");
    out.println("S : a A a a");
    out.println("  | b A b a ;");
    out.println("A : /*eps*/");
    out.println("  | b ;");
    out.println();
    out.println("Authors & License:");
    out.println("Radim Kocman and Dušan Kolář");
    out.println("Apache License Version 2.0");
  }
  
}
