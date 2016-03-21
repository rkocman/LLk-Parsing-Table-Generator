LL(k) Parsing Table Generator
========
LL(k) Parsing Table Generator for Automaton with One-Symbol Reading Head

**Project status:** completed  
**Environment:** JavaScript / Java / HTML  
**Development suite:** NetBeans IDE (8.0)


## User Guide

The are two distinct interfaces that can be used; both built around the same 
core algorithm which is written in JavaScript.   
The graphical user interface is based on standard web technologies and can
run in any modern web browser.  
The command-line interface is based on Java and its scripting engine Nashorn.

### Graphical User Interface
1. Download folder `dist/llkptg/`
2. Open `index.html` in a web browser
3. Further instructions are written on the page

**Browser compatibility:** IE9+ (without export), FF, Chrome, Opera, ...

### Command-Line Interface
1. Install [JRE 8](http://www.oracle.com/technetwork/java/javase/downloads/index.html) or newer
2. Download file `dist/llkptg.jar`
3. Run `java -jar llkptg.jar` or `java -Dfile.encoding=UTF8 -jar llkptg.jar`
4. For further instructions use `--help`


## Developer Guide
1. Install [JDK 8](http://www.oracle.com/technetwork/java/javase/downloads/index.html) or newer
2. Install [NetBeans IDE 8.0](https://netbeans.org/downloads/) or newer
3. Clone and build LL(k) Parsing Table Generator


## Based On
Kolář, D.: Simulation of LLk Parsers with Wide Context by Automaton with One-Symbol Reading Head.  
Aho, A.V., Ullman, J.D.: The Theory of Parsing, Translation, and Compiling, Volume I: Parsing.


## Authors & License
Radim Kocman and Dušan Kolář  
Apache License Version 2.0