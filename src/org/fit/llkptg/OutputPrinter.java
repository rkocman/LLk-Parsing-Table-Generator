/*!
 * LL(k) Parsing Table Generator
 * https://github.com/rkocman/LLk-Parsing-Table-Generator
 * Authors: Radim Kocman and Dušan Kolář
 */
package org.fit.llkptg;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

/**
 * Prints the resulting LL(k) parsing table as CSV.
 */
public class OutputPrinter {
  
  /**
   * Prints the LL(k) parsing table as CSV.
   * @param output output stream
   * @param table parsing table
   * @param outputFormat type of CSV
   */
  public void print(OutputStream output, 
          String[][] table, SettingsOutputFormat outputFormat) {
    
    // prepare the format
    CSVFormat format;
    if (outputFormat == SettingsOutputFormat.csv1) {
      format = CSVFormat.EXCEL;
    } else {
      format = CSVFormat.EXCEL.withDelimiter(';');
    }
    
    try {
      
      // prepare the CSV printer
      OutputStreamWriter writer = new OutputStreamWriter(output, "UTF-8");
      writer.write('\ufeff'); // UTF-8 BOM
      CSVPrinter printer;
      printer = new CSVPrinter(writer, format);
      
      // print the result
      printer.printRecords((Object[])table);
      
      printer.close();
      writer.close();
      
    } catch (IOException ex) {
      System.err.println("Cannot write the result into the output file.");
    }
  }
  
}
