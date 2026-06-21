import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import Editor from '@monaco-editor/react';
import html2canvas from 'html2canvas';
import { simulateCodeExecution, executeCodeAsync } from './CppPlaygroundDialog';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Box,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  useTheme,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Loop as SyncIcon,
  PlayArrow as PlayIcon,
  Terminal as TerminalIcon,
  HelpOutline as HelpIcon,
  Remove as RemoveIcon,
  Visibility as PreviewIcon,
  ErrorOutline as ErrorIcon,
  GetApp as DownloadIcon,
  FileUpload as UploadIcon
} from '@mui/icons-material';

// Preloaded OOP Examples
const EXAMPLES = [
  {
    name: 'Bank Account System (Inheritance Example)',
    code: `public class BankAccount {
    protected String accountNumber;
    protected double balance;

    public BankAccount(String accNum) {
        accountNumber = accNum;
        balance = 0.0;
    }

    public void deposit(double amount) {
        balance = balance + amount;
    }

    public void withdraw(double amount) {
        balance = balance - amount;
    }

    public double getBalance() {
        return balance;
    }
}

public class SavingsAccount extends BankAccount {
    private double interestRate;

    public SavingsAccount(String accNum, double rate) {
        super(accNum);
        interestRate = rate;
    }

    public void addInterest() {
        double interest = balance * interestRate;
        balance = balance + interest;
    }
}`,
    mainCode: `public class Runner {
    public static void main(String[] args) {
        SavingsAccount acc = new SavingsAccount("SA-100", 0.05);
        acc.deposit(200.0);
        acc.addInterest();
        System.out.println("Savings Account Balance: $" + acc.getBalance());
    }
}`
  },
  {
    name: 'Geometric Shapes (Abstraction Example)',
    code: `public abstract class Shape {
    protected String color;

    public Shape(String colorName) {
        color = colorName;
    }

    public abstract double getArea();

    public void displayColor() {
        System.out.println("Color: " + color);
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(String colorName, double r) {
        super(colorName);
        radius = r;
    }

    public double getArea() {
        return 3.14159 * radius * radius;
    }
}`,
    mainCode: `public class Runner {
    public static void main(String[] args) {
        Circle c = new Circle("Crimson Red", 5.0);
        c.displayColor();
        System.out.println("Circle Area: " + c.getArea());
    }
}`
  },
  {
    name: 'Car Engine Assembly (Composition/Has-A Example)',
    code: `public class Engine {
    private int horsepower;

    public Engine(int hp) {
        horsepower = hp;
    }

    public void start() {
        System.out.println("Engine started with " + horsepower + " HP!");
    }
}

public class Car {
    private String model;
    private Engine engine;

    public Car(String modelName) {
        model = modelName;
        engine = new Engine(250);
    }

    public void drive() {
        engine.start();
        System.out.println(model + " is driving down the highway!");
    }
}`,
    mainCode: `public class Runner {
    public static void main(String[] args) {
        Car myCar = new Car("Mustang GT");
        myCar.drive();
    }
}`
  }
];

const umlClassesToJava = (classes) => {
  let code = "";
  classes.forEach(uml => {
    const isInterface = uml.type === "interface";
    
    if (isInterface) {
      code += "public interface " + uml.title;
      if (uml.extendsInterfaces && uml.extendsInterfaces.length > 0) {
        code += " extends " + uml.extendsInterfaces.join(", ");
      }
    } else {
      if (uml.abstract) {
        code += "public abstract class " + uml.title;
      } else {
        code += "public class " + uml.title;
      }
      if (uml.extends) {
        code += " extends " + uml.extends;
      }
      if (!isInterface && uml.implements && uml.implements.length > 0) {
        code += " implements " + uml.implements.join(", ");
      }
    }
    
    code += " {\n";

    // Attributes
    uml.attributes.forEach(attr => {
      const vis = attr.visibility === "public" ? "public" : (attr.visibility === "protected" ? "protected" : "private");
      const isStatic = attr.isStatic ? "static " : "";
      code += `    ${vis} ${isStatic}${attr.type} ${attr.name};\n`;
    });

    if (uml.attributes.length > 0) code += "\n";

    // Methods
    uml.methods.forEach(m => {
      const vis = m.visibility === "public" ? "public" : (m.visibility === "protected" ? "protected" : "private");
      const isStatic = m.isStatic ? "static " : "";
      const isAbstract = m.isAbstract || isInterface;
      
      const paramsStr = (m.parameters || []).map(p => `${p.type} ${p.name}`).join(", ");
      
      if (isAbstract) {
        code += `    ${vis} abstract ${isStatic}${m.returnType} ${m.name}(${paramsStr});\n`;
      } else {
        const retType = m.returnType === "constructor" ? "" : m.returnType + " ";
        
        const bodyText = m.body !== undefined ? m.body : (
          m.returnType !== "void" && m.returnType !== "constructor"
            ? `\n        return ${m.returnType === "int" || m.returnType === "double" || m.returnType === "float" ? "0.0" : (m.returnType === "boolean" ? "false" : "null")};\n    `
            : '\n    '
        );
        
        code += `    ${vis} ${isStatic}${retType}${m.name}(${paramsStr}) {${bodyText}}\n`;
      }
    });

    code += "}\n\n";
  });
  
  return code.trim() + "\n";
};

const STRICT_KNOWN_TYPES = new Set([
  'void', 'int', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'long',
  'String', 'Object',
  'Integer', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short', 'Long',
  'List', 'Map', 'Set', 'ArrayList', 'HashMap', 'HashSet',
  'System', 'Scanner', 'Math', 'PrintStream'
]);

const validateJavaType = (typeStr, declaredClasses = []) => {
  const words = typeStr.match(/[A-Za-z0-9_]+/g);
  if (!words || words.length === 0) {
    throw new Error(`Type '${typeStr}' is not valid`);
  }
  for (const word of words) {
    if (/^\d+$/.test(word)) continue;
    if (!STRICT_KNOWN_TYPES.has(word) && !declaredClasses.includes(word)) {
      throw new Error(`Type '${word}' in type expression '${typeStr}' is not a recognized type. Allowed types are Java primitives, standard collections (List, Map, Set, etc.), and classes defined in the workspace.`);
    }
  }
};

const parseParams = (rawParams, declaredClasses = []) => {
  if (!rawParams.trim()) return [];
  
  // Split parameters by commas at depth 0 (avoid splitting generic types like Map<K,V>)
  const parts = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < rawParams.length; i++) {
    const char = rawParams[i];
    if (char === '<') depth++;
    else if (char === '>') depth--;
    
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);

  return parts.map(p => {
    const clean = p.trim();
    const match = /^([A-Za-z0-9_$<>[\]]+)\s+([A-Za-z0-9_$]+)$/.exec(clean);
    if (!match) {
      throw new Error(`Invalid parameter declaration: '${clean}'`);
    }
    const type = match[1];
    const name = match[2];
    
    if (!/^[A-Za-z_]+[0-9]*$/.test(name)) {
      throw new Error(`Parameter name '${name}' is not a valid Java identifier (numbers only come at the end, no special characters allowed)`);
    }
    const baseType = type.split('<')[0].split('[')[0];
    if (!/^[A-Za-z_]+[0-9]*$/.test(baseType)) {
      throw new Error(`Type '${type}' is not a valid type identifier`);
    }
    validateJavaType(type, declaredClasses);

    return { type, name };
  });
};

const parseMethodSignature = (sig, uml, declaredClasses = []) => {
  const methodRegex = /^(public|private|protected)?\s*(static\s+)?(abstract\s+)?([A-Za-z0-9_$<>[\]]+)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/;
  let match = methodRegex.exec(sig);
  
  if (match) {
    const visibility = match[1] || "public";
    const isStatic = !!match[2];
    const isAbstract = !!match[3];
    const returnType = match[4];
    const name = match[5];
    const rawParams = match[6] || "";

    if (!/^[A-Za-z_]+[0-9]*$/.test(name)) {
      throw new Error(`Method name '${name}' is not a valid Java identifier (numbers only come at the end, no special characters allowed)`);
    }
    const baseType = returnType.split('<')[0].split('[')[0];
    if (!/^[A-Za-z_]+[0-9]*$/.test(baseType) && returnType !== "void") {
      throw new Error(`Return type '${returnType}' is not a valid type identifier`);
    }
    if (name !== uml.title && returnType !== "void") {
      validateJavaType(returnType, declaredClasses);
    }

    const parameters = parseParams(rawParams, declaredClasses);

    const paramSignature = parameters.map(p => p.type).join(",");
    const isDuplicate = uml.methods.some(m => 
      m.name === name && 
      m.parameters.map(p => p.type).join(",") === paramSignature
    );
    if (isDuplicate) {
      throw new Error(`Duplicate method signature '${name}(${paramSignature})' in class/interface '${uml.title}'`);
    }

    uml.methods.push({
      name,
      returnType: name === uml.title ? "constructor" : returnType,
      visibility,
      isStatic,
      isAbstract,
      parameters
    });
    return true;
  } else {
    const constrRegex = /^(public|private|protected)?\s*([A-Za-z0-9_$]+)\s*\(([^)]*)\)/;
    match = constrRegex.exec(sig);
    if (match) {
      const visibility = match[1] || "public";
      const name = match[2];
      const rawParams = match[3] || "";
      
      if (name === uml.title) {
        if (!/^[A-Za-z_]+[0-9]*$/.test(name)) {
          throw new Error(`Constructor name '${name}' is not a valid Java identifier`);
        }
        const parameters = parseParams(rawParams, declaredClasses);
        
        const paramSignature = parameters.map(p => p.type).join(",");
        if (uml.methods.some(m => m.name === name && m.returnType === "constructor" && m.parameters.map(p => p.type).join(",") === paramSignature)) {
          throw new Error(`Duplicate constructor signature '${name}(${paramSignature})' in class/interface '${uml.title}'`);
        }

        uml.methods.push({
          name,
          returnType: "constructor",
          visibility,
          isStatic: false,
          isAbstract: false,
          parameters
        });
        return true;
      }
    }
  }
  throw new Error(`Invalid method or constructor declaration syntax: '${sig}'`);
};

const parseAttributeSignature = (sig, uml, declaredClasses = []) => {
  const attrRegex = /^(public|private|protected)?\s*(static\s+)?([A-Za-z0-9_$<>[\]]+)\s+([A-Za-z0-9_$]+)\s*(?:=.*)?$/;
  const match = attrRegex.exec(sig);
  if (!match) {
    throw new Error(`Invalid field declaration syntax: '${sig}'`);
  }

  const visibility = match[1] || "private";
  const isStatic = !!match[2];
  const type = match[3];
  const name = match[4];

  if (!/^[A-Za-z_]+[0-9]*$/.test(name)) {
    throw new Error(`Variable name '${name}' is not a valid Java identifier (numbers only come at the end, no special characters allowed)`);
  }

  const baseType = type.split('<')[0].split('[')[0];
  if (!/^[A-Za-z_]+[0-9]*$/.test(baseType)) {
    throw new Error(`Type '${type}' is not a valid type identifier`);
  }
  validateJavaType(type, declaredClasses);

  if (uml.attributes.some(a => a.name === name)) {
    throw new Error(`Duplicate variable name '${name}' in class/interface '${uml.title}'`);
  }

  uml.attributes.push({
    name,
    type,
    visibility,
    isStatic
  });
  return true;
};

const calculateCardWidth = (umlClass) => {
  let maxWidth = 280; // Minimum default width
  
  // Calculate width from attributes
  (umlClass.attributes || []).forEach(attr => {
    const typeLen = attr.type ? attr.type.length : 0;
    const nameLen = attr.name ? attr.name.length : 0;
    const typeSelectWidth = Math.max(70, typeLen * 8 + 24);
    const nameInputWidth = Math.max(60, nameLen * 8 + 12);
    // Visibility select (32) + typeSelectWidth + nameInputWidth + Static checkbox (36) + Delete button (24) + gaps/padding (36)
    const rowWidth = 32 + typeSelectWidth + nameInputWidth + 36 + 24 + 36;
    if (rowWidth > maxWidth) {
      maxWidth = rowWidth;
    }
  });

  // Calculate width from methods
  (umlClass.methods || []).forEach(method => {
    const typeLen = method.returnType ? method.returnType.length : 0;
    const nameLen = method.name ? method.name.length : 0;
    const typeSelectWidth = Math.max(70, typeLen * 8 + 24);
    const nameInputWidth = Math.max(60, nameLen * 8 + 12);
    // Visibility select (32) + typeSelectWidth + nameInputWidth + Static & Abstract checkboxes (68) + Delete button (24) + gaps/padding (36)
    const rowWidth = 32 + typeSelectWidth + nameInputWidth + 68 + 24 + 36;
    if (rowWidth > maxWidth) {
      maxWidth = rowWidth;
    }
  });

  // Add safety padding and cap at 600px
  return Math.min(600, maxWidth);
};

const calculateCompressedCardWidth = (umlClass) => {
  let maxWidth = 180; // Minimum default compressed width
  
  // Title len
  const titleLen = (umlClass.title || '').length;
  const titleWidth = titleLen * 9 + 40;
  if (titleWidth > maxWidth) maxWidth = titleWidth;
  
  // Extends len
  if (umlClass.extends) {
    const extLen = `extends ${umlClass.extends}`.length;
    const extWidth = extLen * 8 + 40;
    if (extWidth > maxWidth) maxWidth = extWidth;
  }

  // Attributes
  (umlClass.attributes || []).forEach(attr => {
    const visSign = attr.visibility === 'public' ? '+' : (attr.visibility === 'protected' ? '#' : '-');
    const text = `${visSign} ${attr.name}: ${attr.type}`;
    const textWidth = text.length * 7.5 + 30; // approx width in monospace
    if (textWidth > maxWidth) maxWidth = textWidth;
  });

  // Methods
  (umlClass.methods || []).forEach(method => {
    const visSign = method.visibility === 'public' ? '+' : (method.visibility === 'protected' ? '#' : '-');
    const paramStrings = (method.parameters || []).map(p => `${p.type} ${p.name}`);
    const paramStr = paramStrings.join(', ');
    const returnTypeStr = method.returnType === 'constructor' ? '' : `: ${method.returnType}`;
    const text = `${visSign} ${method.name}(${paramStr})${returnTypeStr}`;
    const textWidth = text.length * 7.5 + 30; // approx width in monospace
    if (textWidth > maxWidth) maxWidth = textWidth;
  });

  return Math.min(320, maxWidth); // Cap at 320 to keep it clean
};

const javaToUmlClasses = (code) => {
  let cleanCode = code
    .replace(/\/\/.*$/gm, "") 
    .replace(/\/\*[\s\S]*?\*\//g, ""); 

  // Collect all declared classes/interfaces in the code first
  const declaredClasses = [];
  const classDeclRegexForNames = /(?:(public|protected|private)\s+)?(?:(abstract)\s+)?(class|interface)\s+([A-Za-z0-9_]+)/g;
  let cnMatch;
  while ((cnMatch = classDeclRegexForNames.exec(cleanCode)) !== null) {
    declaredClasses.push(cnMatch[4]);
  }

  const classes = [];
  const classDeclRegex = /(?:(public|protected|private)\s+)?(?:(abstract)\s+)?(class|interface)\s+([A-Za-z0-9_]+)/g;
  let match;
  
  while ((match = classDeclRegex.exec(cleanCode)) !== null) {
    const isAbstract = !!match[2];
    const type = match[3]; // 'class' | 'interface'
    const className = match[4];
    const searchStart = match.index + match[0].length;
    
    if (!/^[A-Za-z_]+[0-9]*$/.test(className)) {
      const lineNum = code.substring(0, code.indexOf(className) || 0).split('\n').length;
      throw new Error(`Class/Interface name '${className}' at line ${lineNum} is not a valid Java identifier. Suggestion: Class names must start with a letter and contain only letters and underscores with numbers only at the end (no digits in middle/start, no special characters).`);
    }
    const openBraceIdx = cleanCode.indexOf("{", searchStart);
    if (openBraceIdx === -1) continue;
    
    const signatureText = cleanCode.substring(searchStart, openBraceIdx).trim();
    
    let extendsClass = null;
    let extendsList = [];
    let implementsList = [];
    
    const extendsIdx = signatureText.indexOf("extends");
    const implementsIdx = signatureText.indexOf("implements");
    
    if (extendsIdx !== -1 && implementsIdx !== -1 && implementsIdx < extendsIdx) {
      const lineNum = code.substring(0, code.indexOf(className) || 0).split('\n').length;
      throw new Error(`Syntax Error in class '${className}' declaration signature around line ${lineNum}: 'extends' must come before 'implements'. Suggestion: Reorder the signature as: class A extends B implements C.`);
    }
    
    let extendsPart = "";
    let implementsPart = "";
    
    if (extendsIdx !== -1) {
      if (implementsIdx !== -1 && implementsIdx > extendsIdx) {
        extendsPart = signatureText.substring(extendsIdx + 7, implementsIdx).trim();
        implementsPart = signatureText.substring(implementsIdx + 10).trim();
      } else {
        extendsPart = signatureText.substring(extendsIdx + 7).trim();
      }
    } else if (implementsIdx !== -1) {
      implementsPart = signatureText.substring(implementsIdx + 10).trim();
    }
    
    if (extendsPart) {
      extendsList = extendsPart.split(",").map(s => s.trim()).filter(s => s.length > 0);
      if (type === 'class') {
        if (extendsList.length > 1) {
          const lineNum = code.substring(0, code.indexOf(className) || 0).split('\n').length;
          throw new Error(`Inheritance Error: Class '${className}' around line ${lineNum} cannot extend multiple classes: ${extendsList.join(", ")}. Suggestion: Java does not support multiple class inheritance. Extend only one base class, and implement other interfaces instead.`);
        }
        extendsClass = extendsList[0] || null;
      }
    }
    
    if (implementsPart) {
      implementsList = implementsPart.split(",").map(s => s.trim()).filter(s => s.length > 0);
      if (type === 'interface') {
        const lineNum = code.substring(0, code.indexOf(className) || 0).split('\n').length;
        throw new Error(`Inheritance Error: Interface '${className}' around line ${lineNum} cannot use 'implements' keyword. Suggestion: Interfaces can only use 'extends' to inherit from other interfaces. Remove the 'implements' clause.`);
      }
    }
    
    let depth = 1;
    let closeBraceIdx = -1;
    for (let i = openBraceIdx + 1; i < cleanCode.length; i++) {
      if (cleanCode[i] === '{') depth++;
      else if (cleanCode[i] === '}') {
        depth--;
        if (depth === 0) {
          closeBraceIdx = i;
          break;
        }
      }
    }
    if (closeBraceIdx === -1) {
      const lineNum = code.substring(0, code.indexOf(className) || 0).split('\n').length;
      throw new Error(`Syntax Error: Class/Interface '${className}' body starting on line ${lineNum} is missing closing brace '}'. Suggestion: Add a matching closing brace '}' at the end of the class declaration.`);
    }
    const classBody = cleanCode.substring(openBraceIdx + 1, closeBraceIdx);
    classDeclRegex.lastIndex = closeBraceIdx + 1;
    
    const uml = {
      title: className,
      type: type,
      abstract: isAbstract,
      extends: type === 'class' ? extendsClass : null,
      extendsInterfaces: type === 'interface' ? extendsList : [],
      implements: implementsList,
      attributes: [],
      methods: []
    };
    
    let accumulated = "";
    let methodBodyAccumulated = "";
    let bodyDepth = 0;
    let currentMethodIndex = -1;
    
    for (let charIdx = 0; charIdx < classBody.length; charIdx++) {
      const char = classBody[charIdx];
      
      if (char === '{') {
        if (bodyDepth === 0) {
          const sig = accumulated.trim();
          if (sig.length > 0) {
            parseMethodSignature(sig, uml, declaredClasses);
            currentMethodIndex = uml.methods.length - 1;
          }
          accumulated = "";
          methodBodyAccumulated = "";
        } else {
          methodBodyAccumulated += char;
        }
        bodyDepth++;
      } else if (char === '}') {
        bodyDepth--;
        if (bodyDepth < 0) {
          break;
        }
        if (bodyDepth === 0) {
          if (currentMethodIndex !== -1 && uml.methods[currentMethodIndex]) {
            uml.methods[currentMethodIndex].body = methodBodyAccumulated;
          }
          accumulated = "";
          methodBodyAccumulated = "";
          currentMethodIndex = -1;
        } else {
          methodBodyAccumulated += char;
        }
      } else if (char === ';') {
        if (bodyDepth === 0) {
          const decl = accumulated.trim();
          if (decl.length > 0) {
            if (decl.includes("(")) {
              parseMethodSignature(decl, uml, declaredClasses);
            } else {
              parseAttributeSignature(decl, uml, declaredClasses);
            }
          }
          accumulated = "";
        } else {
          methodBodyAccumulated += char;
        }
      } else {
        if (bodyDepth === 0) {
          accumulated += char;
        } else {
          methodBodyAccumulated += char;
        }
      }
    }
    
    if (accumulated.trim().length > 0) {
      const tokenIdx = code.indexOf(accumulated.trim(), code.indexOf(className));
      const lineNum = tokenIdx !== -1 ? code.substring(0, tokenIdx).split('\n').length : 1;
      throw new Error(`Syntax Error: Unexpected leftover token '${accumulated.trim()}' inside class '${className}' around line ${lineNum}. Suggestion: Check if you are missing a semicolon ';' or a method body opening brace '{'.`);
    }
    
    classes.push(uml);
  }
  
  return classes;
};

const validateProposedClasses = (classes) => {
  // 1. Check duplicate class/interface names
  const titles = classes.map(c => c.title);
  const duplicates = titles.filter((item, index) => titles.indexOf(item) !== index);
  if (duplicates.length > 0) {
    return `Duplicate class/interface name: '${duplicates[0]}'`;
  }

  // Create typeMap to verify target types (class vs interface)
  const typeMap = {};
  for (const c of classes) {
    typeMap[c.title] = c.type;
  }

  // 2. Check self-inheritance / implements and interchangeable relationships
  for (const c of classes) {
    if (c.extends) {
      if (c.extends === c.title) {
        return `Class '${c.title}' cannot extend itself.`;
      }
      const parentType = typeMap[c.extends];
      if (parentType === 'interface') {
        return `Class '${c.title}' cannot extend interface '${c.extends}'. Classes must use 'implements' to implement interfaces.`;
      }
    }

    if (c.extendsInterfaces) {
      for (const parent of c.extendsInterfaces) {
        if (parent === c.title) {
          return `Interface '${c.title}' cannot extend itself.`;
        }
        const parentType = typeMap[parent];
        if (parentType === 'class') {
          return `Interface '${c.title}' cannot extend class '${parent}'. Interfaces can only extend other interfaces.`;
        }
      }
    }

    if (c.implements) {
      for (const imp of c.implements) {
        if (imp === c.title) {
          return `Class/Interface '${c.title}' cannot implement itself.`;
        }
        const targetType = typeMap[imp];
        if (targetType === 'class') {
          return `Class '${c.title}' cannot implement class '${imp}'. Classes must use 'extends' to inherit from other classes.`;
        }
      }
      if (c.type === 'interface' && c.implements.length > 0) {
        return `Interface '${c.title}' cannot implement other structures. Interfaces must use 'extends' to inherit other interfaces.`;
      }
    }
  }

  // 3. Cycle detection (DFS)
  const visited = {};
  const recStack = {};

  const hasCycle = (node, path = []) => {
    if (!visited[node]) {
      visited[node] = true;
      recStack[node] = true;
      path.push(node);

      const c = classes.find(x => x.title === node);
      if (c) {
        const neighbors = [];
        if (c.type === 'class' && c.extends) {
          neighbors.push(c.extends);
        }
        if (c.type === 'interface' && c.extendsInterfaces) {
          c.extendsInterfaces.forEach(parent => neighbors.push(parent));
        }
        if (c.implements) {
          c.implements.forEach(imp => neighbors.push(imp));
        }

        for (const neighbor of neighbors) {
          if (!visited[neighbor]) {
            if (hasCycle(neighbor, path)) {
              return true;
            }
          } else if (recStack[neighbor]) {
            path.push(neighbor);
            return true;
          }
        }
      }

      recStack[node] = false;
      path.pop();
    }
    return false;
  };

  for (const c of classes) {
    const path = [];
    classes.forEach(x => {
      visited[x.title] = false;
      recStack[x.title] = false;
    });
    if (hasCycle(c.title, path)) {
      const cycleStartIdx = path.indexOf(path[path.length - 1]);
      const cyclePath = path.slice(cycleStartIdx);
      const cycleStr = cyclePath.join(" -> ");
      return `Cyclic inheritance/dependency detected: ${cycleStr}`;
    }
  }

  return null;
};

const getDeclaredLocalVars = (bodyText, validTypes) => {
  const declared = new Set();
  const cleanText = bodyText
    .replace(/"(\\.|[^"\\])*"/g, "")
    .replace(/'(\\.|[^'\\])*'/g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // 1. Regex search anywhere for type followed by identifier
  const declRegex = /\b([A-Za-z0-9_]+)(?:<[^>]+>)?(?:\[\])?\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let match;
  while ((match = declRegex.exec(cleanText)) !== null) {
    const type = match[1];
    const varName = match[2];
    if (validTypes.has(type)) {
      declared.add(varName);
    }
  }
  
  // 2. Comma-separated declarations (e.g. int a, b, c;)
  const segments = cleanText.split(/[;{}]/);
  segments.forEach(segment => {
    const trimmed = segment.trim();
    const typeMatch = trimmed.match(/^\b([A-Za-z0-9_]+)(?:<[^>]+>)?(?:\[\])?\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (typeMatch && validTypes.has(typeMatch[1])) {
      const rest = trimmed.substring(typeMatch[0].length);
      declared.add(typeMatch[2]);
      const parts = rest.split(',');
      parts.forEach(part => {
        const partMatch = part.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)/);
        if (partMatch) {
          declared.add(partMatch[1]);
        }
      });
    }
  });

  return declared;
};

const getUsedIdentifiers = (bodyText) => {
  const cleanText = bodyText
    .replace(/"(\\.|[^"\\])*"/g, "")
    .replace(/'(\\.|[^'\\])*'/g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const used = [];
  const identRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let match;
  while ((match = identRegex.exec(cleanText)) !== null) {
    const name = match[1];
    const index = match.index;
    
    // Check if preceded by '.'
    let isPrecededByDot = false;
    let checkIdx = index - 1;
    while (checkIdx >= 0 && /\s/.test(cleanText[checkIdx])) {
      checkIdx--;
    }
    if (checkIdx >= 0 && cleanText[checkIdx] === '.') {
      isPrecededByDot = true;
    }
    
    // Check if followed by '('
    let isFollowedByParen = false;
    let followIdx = index + name.length;
    while (followIdx < cleanText.length && /\s/.test(cleanText[followIdx])) {
      followIdx++;
    }
    if (followIdx < cleanText.length && cleanText[followIdx] === '(') {
      isFollowedByParen = true;
    }

    if (!isPrecededByDot && !isFollowedByParen) {
      used.push({ name, index });
    }
  }
  return used;
};

const checkJavaSyntax = (code) => {
  let braceStack = [];
  let parenStack = [];
  
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let inString = false;
  let inChar = false;
  
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    inSingleLineComment = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (inMultiLineComment) {
        if (char === '*' && nextChar === '/') {
          inMultiLineComment = false;
          j++;
        }
        continue;
      }
      
      if (inSingleLineComment) {
        break;
      }
      
      if (inString) {
        if (char === '\\') {
          j++;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      
      if (inChar) {
        if (char === '\\') {
          j++;
        } else if (char === "'") {
          inChar = false;
        }
        continue;
      }
      
      if (char === '/' && nextChar === '/') {
        inSingleLineComment = true;
        j++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        j++;
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === "'") {
        inChar = true;
        continue;
      }
      
      if (char === '{') {
        braceStack.push({ line: i + 1, col: j + 1 });
      } else if (char === '}') {
        if (braceStack.length === 0) {
          return { error: `Mismatched closing brace '}' at line ${i + 1}, column ${j + 1}. Suggestion: Check if you have an extra '}' or are missing an opening '{' before this line.`, line: i + 1 };
        }
        braceStack.pop();
      }
      
      if (char === '(') {
        parenStack.push({ line: i + 1, col: j + 1 });
      } else if (char === ')') {
        if (parenStack.length === 0) {
          return { error: `Mismatched closing parenthesis ')' at line ${i + 1}, column ${j + 1}. Suggestion: Check if you have an extra ')' or are missing an opening '(' before this line.`, line: i + 1 };
        }
        parenStack.pop();
      }
    }
  }
  
  if (inMultiLineComment) {
    return { error: "Syntax Error: Unclosed block comment (/*). Suggestion: Add '*/' at the end of the comment block to close it.", line: lines.length };
  }
  if (inString) {
    return { error: "Syntax Error: Unclosed string literal. Suggestion: Add a double quote (\") at the end of the line to close the string.", line: lines.length };
  }
  if (braceStack.length > 0) {
    const lastBrace = braceStack[braceStack.length - 1];
    return { error: `Syntax Error: Unclosed curly brace '{' starting at line ${lastBrace.line}, column ${lastBrace.col}. Suggestion: Add a matching closing brace '}' to close this code block.`, line: lastBrace.line };
  }
  if (parenStack.length > 0) {
    const lastParen = parenStack[parenStack.length - 1];
    return { error: `Syntax Error: Unclosed parenthesis '(' starting at line ${lastParen.line}, column ${lastParen.col}. Suggestion: Add a matching closing parenthesis ')' to close this expression.`, line: lastParen.line };
  }
  
  try {
    let cleanCode = code
      .replace(/\/\/.*$/gm, "") 
      .replace(/\/\*[\s\S]*?\*\//g, ""); 
    
    let tempCode = cleanCode;
    tempCode = tempCode.replace(/^\s*package\s+[A-Za-z0-9_.]+\s*;/gm, "");
    tempCode = tempCode.replace(/^\s*import\s+[A-Za-z0-9_.*]+\s*;/gm, "");
    
    const classDeclRegex = /(?:(public|protected|private)\s+)?(?:(abstract)\s+)?(class|interface)\s+([A-Za-z0-9_]+)/g;
    let classMatch;
    let lastIdx = 0;
    let strippedCode = "";
    
    classDeclRegex.lastIndex = 0;
    while ((classMatch = classDeclRegex.exec(tempCode)) !== null) {
      strippedCode += tempCode.substring(lastIdx, classMatch.index);
      const searchStart = classMatch.index + classMatch[0].length;
      const openBraceIdx = tempCode.indexOf("{", searchStart);
      if (openBraceIdx === -1) {
        const lineNum = code.substring(0, classMatch.index).split('\n').length;
        return { error: `Class/Interface declaration '${classMatch[4]}' is missing body opening brace '{' (around line ${lineNum}). Suggestion: Add '{' to start the class body.`, line: lineNum };
      }
      
      let depth = 1;
      let closeBraceIdx = -1;
      for (let i = openBraceIdx + 1; i < tempCode.length; i++) {
        if (tempCode[i] === '{') depth++;
        else if (tempCode[i] === '}') {
          depth--;
          if (depth === 0) {
            closeBraceIdx = i;
            break;
          }
        }
      }
      
      if (closeBraceIdx === -1) {
        const lineNum = code.substring(0, openBraceIdx).split('\n').length;
        return { error: `Class/Interface '${classMatch[4]}' body is missing closing brace '}' (starting on line ${lineNum}). Suggestion: Add a closing brace '}' at the end of the class body.`, line: lineNum };
      }
      lastIdx = closeBraceIdx + 1;
    }
    strippedCode += tempCode.substring(lastIdx);
    
    if (strippedCode.trim().length > 0) {
      const leftover = strippedCode.trim();
      const truncatedLeftover = leftover.length > 30 ? leftover.substring(0, 30) + "..." : leftover;
      const leftoverIndex = code.indexOf(leftover);
      let leftoverLine = 1;
      if (leftoverIndex !== -1) {
        leftoverLine = code.substring(0, leftoverIndex).split('\n').length;
      }
      return { error: `Unexpected top-level code or token: '${truncatedLeftover}' around line ${leftoverLine}. Suggestion: In Java, all statements and variable definitions must be inside a class body. Only class/interface declarations, imports, or packages are allowed at the top level.`, line: leftoverLine };
    }
  } catch (err) {
    return { error: `Syntax error during top-level scan: ${err.message}`, line: 1 };
  }
  
  try {
    const classes = javaToUmlClasses(code);
    const err = validateProposedClasses(classes);
    if (err) {
      return { error: err, line: 1 };
    }

    const declaredClassNames = new Set(classes.map(c => c.title));
    const KNOWN_TYPES = new Set([
      'int', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'long', 'void',
      'String', 'Integer', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short', 'Long', 'Object',
      'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet', 'Collection', 'Iterator',
      'Scanner', 'System', 'Math', 'Exception', 'Throwable', 'PrintStream', 'Thread', 'Runnable',
      'StringTokenizer', 'StringBuilder', 'StringBuffer'
    ]);
    const validTypes = new Set([...KNOWN_TYPES, ...declaredClassNames]);

    const JAVA_KEYWORDS = new Set([
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
      'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
      'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
      'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
      'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
      'volatile', 'while', 'true', 'false', 'null', 'String', 'Integer', 'Double', 'Float',
      'Boolean', 'Character', 'Byte', 'Short', 'Long', 'Object', 'List', 'ArrayList', 'Map',
      'HashMap', 'Set', 'HashSet', 'System', 'Scanner', 'Math', 'Exception', 'PrintStream'
    ]);

    for (let c of classes) {
      // Visible attributes in this class
      const classAttributes = new Set(c.attributes.map(a => a.name));
      
      // Inherited public/protected fields
      let parentName = c.extends;
      let depth = 0;
      while (parentName && depth < 10) {
        const parent = classes.find(p => p.title === parentName);
        if (parent) {
          parent.attributes.forEach(a => {
            if (a.visibility === 'public' || a.visibility === 'protected') {
              classAttributes.add(a.name);
            }
          });
          parentName = parent.extends;
        } else {
          break;
        }
        depth++;
      }

      for (let m of c.methods) {
        if (m.body) {
          const methodParams = new Set((m.parameters || []).map(p => p.name));
          const localVars = getDeclaredLocalVars(m.body, validTypes);
          
          const declaredInScope = new Set([
            ...classAttributes,
            ...methodParams,
            ...localVars
          ]);

          const usedIdentifiers = getUsedIdentifiers(m.body);

          for (let ident of usedIdentifiers) {
            if (!declaredInScope.has(ident.name) && 
                !JAVA_KEYWORDS.has(ident.name) && 
                !declaredClassNames.has(ident.name)) {
              
              const classIdx = code.indexOf(c.title);
              const methodSigStart = code.indexOf(m.name, classIdx !== -1 ? classIdx : 0);
              const bodyStart = code.indexOf(m.body, methodSigStart !== -1 ? methodSigStart : 0);
              const absoluteIndex = (bodyStart !== -1 ? bodyStart : 0) + ident.index;
              const lineNum = code.substring(0, absoluteIndex).split('\n').length;
              
              return {
                error: `Compilation Error: Variable '${ident.name}' cannot be resolved. It has not been declared in this scope (around line ${lineNum}). Suggestion: Declare '${ident.name}' as a local variable, method parameter, or class attribute before using it.`,
                line: lineNum
              };
            }
          }
        }
      }
    }
  } catch (err) {
    return { error: `Parser error: ${err.message}. Suggestion: Check the syntax of your class declarations, field/method types, and signatures.`, line: 1 };
  }
  
  return null;
};

const analyzeRelationships = (classes) => {
  const relations = []; // { source, target, type, fieldName }
  
  classes.forEach(c => {
    // 1. Inheritance
    if (c.type === 'class' && c.extends) {
      relations.push({ source: c.title, target: c.extends, type: 'extends' });
    }
    if (c.type === 'interface' && c.extendsInterfaces && c.extendsInterfaces.length > 0) {
      c.extendsInterfaces.forEach(parent => {
        relations.push({ source: c.title, target: parent, type: 'extends' });
      });
    }
    
    // Realization (implements)
    if (c.implements && c.implements.length > 0) {
      c.implements.forEach(imp => {
        relations.push({ source: c.title, target: imp, type: 'implements' });
      });
    }
    
    // 2. Attributes (Composition, Aggregation, Association)
    c.attributes.forEach(attr => {
      const targetClass = classes.find(p => p.title === attr.type && p.title !== c.title);
      if (targetClass) {
        // Let's check if it's instantiated in any constructor
        let isInstantiatedInConstructor = false;
        c.methods.forEach(m => {
          if (m.returnType === 'constructor' && m.body) {
            const newRegex = new RegExp(`new\\s+${targetClass.title}\\b`);
            if (newRegex.test(m.body)) {
              isInstantiatedInConstructor = true;
            }
          }
        });
        
        let type = 'aggregation';
        if (isInstantiatedInConstructor) {
          type = 'composition';
        } else if (attr.visibility === 'public' || attr.visibility === 'protected') {
          type = 'association';
        }
        
        relations.push({ source: c.title, target: targetClass.title, type, fieldName: attr.name });
      }
    });
    
    // 3. Methods (Dependency)
    c.methods.forEach(m => {
      // Check parameters
      (m.parameters || []).forEach(p => {
        const targetClass = classes.find(pClass => pClass.title === p.type && pClass.title !== c.title);
        if (targetClass) {
          // Verify we don't already have an attribute-level relation (which is stronger)
          const existing = relations.find(r => r.source === c.title && r.target === targetClass.title && r.type !== 'dependency');
          if (!existing) {
            relations.push({ source: c.title, target: targetClass.title, type: 'dependency', methodName: m.name });
          }
        }
      });
      
      // Check local instantiation inside method body
      if (m.body && m.returnType !== 'constructor') {
        classes.forEach(targetClass => {
          if (targetClass.title !== c.title) {
            const newRegex = new RegExp(`new\\s+${targetClass.title}\\b`);
            if (newRegex.test(m.body)) {
              const existing = relations.find(r => r.source === c.title && r.target === targetClass.title);
              if (!existing) {
                relations.push({ source: c.title, target: targetClass.title, type: 'dependency', methodName: m.name });
              }
            }
          }
        });
      }
    });
  });
  
  return relations;
};

export const JavaOopUmlPlayground = ({ open, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { themeMode } = useContext(ThemeContext);

  const [code, setCode] = useState(EXAMPLES[0].code);
  const [umlClasses, setUmlClasses] = useState(javaToUmlClasses(EXAMPLES[0].code));
  const [syntaxError, setSyntaxError] = useState(null);
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);

  const [activeTab, setActiveTab] = useState('uml'); // 'uml' | 'runner'
  const [inputStr, setInputStr] = useState('');
  const [mainCode, setMainCode] = useState(EXAMPLES[0].mainCode);
  const [terminalOutput, setTerminalOutput] = useState('Terminal ready. Click "RUN JAVA CODE" to execute.');
  const [isRunning, setIsRunning] = useState(false);

  const fileInputRef = useRef(null);

  const handleDownloadCode = () => {
    const metadata = {
      classPositions
    };
    const metadataJson = JSON.stringify(metadata, null, 2);
    // Format metadata as java comments
    const metadataComments = "\n\n// === UML_METADATA_START ===\n" + 
      metadataJson.split('\n').map(line => `// ${line}`).join('\n') + 
      "\n// === UML_METADATA_END ===\n";

    const combined = code + metadataComments + "\n\n// === RUNNER_SECTION_START ===\n\n" + mainCode;
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Playground.java';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCode = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        let classesPart = '';
        let mainPart = '';

        if (text.includes('// === RUNNER_SECTION_START ===')) {
          const parts = text.split('// === RUNNER_SECTION_START ===');
          classesPart = parts[0].trim();
          mainPart = parts[1].trim();
        } else if (text.includes('public static void main')) {
          // Smart extraction of the class enclosing 'public static void main'
          const mainMethodIndex = text.indexOf('public static void main');
          const classIndex = text.lastIndexOf('class', mainMethodIndex);
          if (classIndex !== -1) {
            const openBraceIndex = text.indexOf('{', classIndex);
            if (openBraceIndex !== -1 && openBraceIndex < mainMethodIndex) {
              // Find matching closing brace
              let braceCount = 1;
              let i = openBraceIndex + 1;
              while (i < text.length && braceCount > 0) {
                if (text[i] === '{') braceCount++;
                else if (text[i] === '}') braceCount--;
                i++;
              }
              if (braceCount === 0) {
                // Backtrack from classIndex to include class modifiers (like public)
                let startOfClass = classIndex;
                const prefix = text.substring(0, classIndex).trim();
                const lastWord = prefix.split(/\s+/).pop();
                if (lastWord === 'public' || lastWord === 'protected' || lastWord === 'private') {
                  startOfClass = text.lastIndexOf(lastWord, classIndex);
                }
                
                mainPart = text.substring(startOfClass, i).trim();
                classesPart = (text.substring(0, startOfClass) + '\n' + text.substring(i)).trim();
              } else {
                classesPart = text.trim();
              }
            } else {
              classesPart = text.trim();
            }
          } else {
            classesPart = text.trim();
          }
        } else {
          classesPart = text.trim();
        }

        // Parse UML metadata if present
        let importedPositions = null;
        if (text.includes('// === UML_METADATA_START ===')) {
          try {
            const startTag = '// === UML_METADATA_START ===';
            const endTag = '// === UML_METADATA_END ===';
            const startIndex = text.indexOf(startTag);
            const endIndex = text.indexOf(endTag);
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
              const metadataSection = text.substring(startIndex + startTag.length, endIndex);
              const jsonLines = metadataSection.split('\n')
                .map(line => line.trim().replace(/^\/\/\s*/, ''))
                .filter(line => line.length > 0)
                .join('');
              importedPositions = JSON.parse(jsonLines).classPositions;
            }
          } catch (err) {
            console.error("Failed to parse UML metadata on import:", err);
          }
        }

        // Strip metadata comments from classesPart so it remains clean Java code in the editor
        let cleanClassesPart = classesPart;
        if (classesPart.includes('// === UML_METADATA_START ===')) {
          const startIdx = classesPart.indexOf('// === UML_METADATA_START ===');
          const endIdx = classesPart.indexOf('// === UML_METADATA_END ===');
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanClassesPart = (classesPart.substring(0, startIdx) + classesPart.substring(endIdx + '// === UML_METADATA_END ==='.length)).trim();
          }
        }

        setCode(cleanClassesPart);
        if (mainPart) {
          setMainCode(mainPart);
        }
        if (importedPositions) {
          setClassPositions(importedPositions);
        }
        
        try {
          const parsed = javaToUmlClasses(cleanClassesPart);
          setUmlClasses(parsed);
        } catch (err) {
          console.error("UML parsing failed on import:", err);
        }
      };
      reader.readAsText(file);
    }
  };

  const [isEditorReady, setIsEditorReady] = useState(false);
  const [splitPercent, setSplitPercent] = useState(55);

  // 2D Interactive Canvas States
  const [classPositions, setClassPositions] = useState({});
  const [draggingClass, setDraggingClass] = useState(null);

  const [connectingSource, setConnectingSource] = useState(null);
  const [connectionStart, setConnectionStart] = useState(null);
  const [connectionCurrent, setConnectionCurrent] = useState(null);

  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [newConnectionData, setNewConnectionData] = useState({ source: '', target: '' });
  const [newFieldName, setNewFieldName] = useState('');
  const [newRelationType, setNewRelationType] = useState('extends');

  // Zoom and Preview States
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewZoomScale, setPreviewZoomScale] = useState(1.0);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [currentInputVal, setCurrentInputVal] = useState('');
  const [previewTheme, setPreviewTheme] = useState('light');

  useEffect(() => {
    if (isPreviewOpen) {
      setPreviewTheme(themeMode);
    }
  }, [isPreviewOpen, themeMode]);

  // Refs (All declared at the top of the component to prevent TDZ/initialization errors in hooks)
  const isDraggingSplitRef = useRef(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const internalUpdateRef = useRef(false);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const umlEditorRef = useRef(null);
  const execEditorRef = useRef(null);
  const runnerEditorRef = useRef(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const canvasContainerRef = useRef(null);
  const inputResolverRef = useRef(null);
  const isPanningPreviewRef = useRef(false);
  const panStartPreviewRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const previewCanvasContainerRef = useRef(null);
  const zoomAnchorRef = useRef(null);
  const previewZoomAnchorRef = useRef(null);

  // Validate syntax on mount to check initial preloaded code state
  useEffect(() => {
    const err = checkJavaSyntax(code);
    if (err) {
      setSyntaxError(err);
    } else {
      try {
        setUmlClasses(javaToUmlClasses(code));
        setSyntaxError(null);
      } catch (parserErr) {
        setSyntaxError({ error: parserErr.message, line: 1 });
      }
    }
  }, []);

  // Resolve UML card overlaps when card width increases during typing/updates
  useEffect(() => {
    if (!umlClasses || umlClasses.length === 0) return;

    const newPositions = { ...classPositions };
    let changed = false;

    // Map each class with its current x, y coordinate and dynamic width
    const mapped = umlClasses.map((c, idx) => {
      const pos = newPositions[c.title] || {
        x: 50 + (idx % 3) * 420,
        y: 50 + Math.floor(idx / 3) * 460
      };
      return {
        title: c.title,
        x: pos.x,
        y: pos.y,
        width: calculateCardWidth(c)
      };
    });

    // Sort cards from left to right (by X position)
    mapped.sort((a, b) => a.x - b.x);

    const GAP = 30; // Horizontal gap between cards

    for (let i = 0; i < mapped.length; i++) {
      const cardA = mapped[i];
      for (let j = i + 1; j < mapped.length; j++) {
        const cardB = mapped[j];
        
        // If they are on the "same row" (vertical coordinates overlap or are very close, e.g. within 150px)
        const isSameRow = Math.abs(cardA.y - cardB.y) < 150;
        if (isSameRow) {
          // If cardA right border (with gap) overlaps cardB left border
          if (cardA.x + cardA.width + GAP > cardB.x) {
            const pushDistance = (cardA.x + cardA.width + GAP) - cardB.x;
            cardB.x += pushDistance;
            newPositions[cardB.title] = { x: cardB.x, y: cardB.y };
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setClassPositions(newPositions);
    }
  }, [umlClasses]);

  // Zoom scroll positioning adjustments to keep zoom center aligned
  useEffect(() => {
    if (zoomAnchorRef.current && canvasContainerRef.current) {
      const { x_virtual, y_virtual, mx, my } = zoomAnchorRef.current;
      canvasContainerRef.current.scrollLeft = x_virtual * zoomScale - mx;
      canvasContainerRef.current.scrollTop = y_virtual * zoomScale - my;
      zoomAnchorRef.current = null;
    }
  }, [zoomScale]);

  useEffect(() => {
    if (previewZoomAnchorRef.current && previewCanvasContainerRef.current) {
      const { x_virtual, y_virtual, mx, my } = previewZoomAnchorRef.current;
      previewCanvasContainerRef.current.scrollLeft = x_virtual * previewZoomScale - mx;
      previewCanvasContainerRef.current.scrollTop = y_virtual * previewZoomScale - my;
      previewZoomAnchorRef.current = null;
    }
  }, [previewZoomScale]);

  const getCanvasDimensions = () => {
    let maxX = 1500;
    let maxY = 1200;
    umlClasses.forEach(c => {
      const pos = classPositions[c.title];
      if (pos) {
        const cardW = calculateCardWidth(c);
        if (pos.x + cardW + 300 > maxX) {
          maxX = pos.x + cardW + 300;
        }
        if (pos.y + 320 + 300 > maxY) {
          maxY = pos.y + 320 + 300;
        }
      }
    });
    return { width: maxX, height: maxY };
  };
  const canvasDim = getCanvasDimensions();

  // Pre-fill attribute name for composition relationship
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (newConnectionData.target) {
      const defaultName = newConnectionData.target.charAt(0).toLowerCase() + newConnectionData.target.slice(1);
      setNewFieldName(defaultName);
    }
  }, [newConnectionData.target]);

  // Window listeners for dragging the divider in the resizable split view and canvas panning
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSplitRef.current) {
        const container = document.getElementById('split-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const offset = e.clientX - rect.left;
          const newPercent = Math.max(25, Math.min(75, (offset / rect.width) * 100));
          setSplitPercent(newPercent);
        }
      } else if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        if (canvasContainerRef.current) {
          canvasContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
          canvasContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
        }
      } else if (isPanningPreviewRef.current) {
        const dx = e.clientX - panStartPreviewRef.current.x;
        const dy = e.clientY - panStartPreviewRef.current.y;
        if (previewCanvasContainerRef.current) {
          previewCanvasContainerRef.current.scrollLeft = panStartPreviewRef.current.scrollLeft - dx;
          previewCanvasContainerRef.current.scrollTop = panStartPreviewRef.current.scrollTop - dy;
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSplitRef.current) {
        isDraggingSplitRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (isPanningRef.current) {
        isPanningRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (isPanningPreviewRef.current) {
        isPanningPreviewRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleCanvasMouseDown = (e) => {
    // Only pan if clicked on the background grid canvas, not inside a class card, port, menu, dialog, or buttons.
    if (
      e.target.closest('.uml-class-card') || 
      e.target.closest('.uml-port') || 
      e.target.closest('button') || 
      e.target.closest('.MuiSelect-select') ||
      e.target.closest('.MuiSelect-root')
    ) {
      return;
    }

    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasContainerRef.current ? canvasContainerRef.current.scrollLeft : 0,
      scrollTop: canvasContainerRef.current ? canvasContainerRef.current.scrollTop : 0
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handlePreviewCanvasMouseDown = (e) => {
    if (
      e.target.closest('.uml-class-card') || 
      e.target.closest('button')
    ) {
      return;
    }

    e.preventDefault();
    isPanningPreviewRef.current = true;
    panStartPreviewRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: previewCanvasContainerRef.current ? previewCanvasContainerRef.current.scrollLeft : 0,
      scrollTop: previewCanvasContainerRef.current ? previewCanvasContainerRef.current.scrollTop : 0
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  // Non-passive wheel event listeners for smooth Ctrl + Mousewheel zooming
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const x_virtual = (container.scrollLeft + mx) / zoomScale;
        const y_virtual = (container.scrollTop + my) / zoomScale;
        zoomAnchorRef.current = { x_virtual, y_virtual, mx, my };

        const step = 0.05;
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const currentMinZoom = parseFloat(Math.min(0.4, Math.max(0.1, Math.min(containerW / canvasDim.width, containerH / canvasDim.height))).toFixed(2));

        setZoomScale(prev => Math.max(currentMinZoom, Math.min(2.0, prev + (e.deltaY < 0 ? step : -step))));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [canvasContainerRef.current, zoomScale, canvasDim.width, canvasDim.height]);

  useEffect(() => {
    const container = previewCanvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const x_virtual = (container.scrollLeft + mx) / previewZoomScale;
        const y_virtual = (container.scrollTop + my) / previewZoomScale;
        previewZoomAnchorRef.current = { x_virtual, y_virtual, mx, my };

        const step = 0.05;
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const currentMinZoom = parseFloat(Math.min(0.4, Math.max(0.1, Math.min(containerW / canvasDim.width, containerH / canvasDim.height))).toFixed(2));

        setPreviewZoomScale(prev => Math.max(currentMinZoom, Math.min(2.0, prev + (e.deltaY < 0 ? step : -step))));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [previewCanvasContainerRef.current, isPreviewOpen, previewZoomScale, canvasDim.width, canvasDim.height]);

  // Clear editor references on tab change to prevent calling methods on unmounted/disposed editor instances
  useEffect(() => {
    umlEditorRef.current = null;
    execEditorRef.current = null;
    runnerEditorRef.current = null;
  }, [activeTab]);

  // Position assigner/cleaner
  const findFirstEmptySlot = (currentPositions) => {
    let row = 0;
    while (true) {
      for (let col = 0; col < 3; col++) {
        const slotX = 50 + col * 420;
        const slotY = 50 + row * 460;
        
        // Check if any class is close to this slot
        const isOccupied = Object.values(currentPositions).some(pos => {
          const dx = pos.x - slotX;
          const dy = pos.y - slotY;
          return dx * dx + dy * dy < 200 * 200; // overlap threshold
        });
        
        if (!isOccupied) {
          return { x: slotX, y: slotY };
        }
      }
      row++;
    }
  };

  useEffect(() => {
    let updated = false;
    const newPositions = { ...classPositions };
    umlClasses.forEach((c) => {
      if (!newPositions[c.title]) {
        newPositions[c.title] = findFirstEmptySlot(newPositions);
        updated = true;
      }
    });
    // Remove old classes from coordinates
    const classNames = umlClasses.map(c => c.title);
    Object.keys(newPositions).forEach(name => {
      if (!classNames.includes(name)) {
        delete newPositions[name];
        updated = true;
      }
    });
    if (updated) {
      setClassPositions(newPositions);
    }
  }, [umlClasses]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  // Window listeners for moving cards
  useEffect(() => {
    if (!draggingClass) return;

    const handleMouseMove = (e) => {
      // Keep inside bounds of virtual canvas (unclamped on right/bottom to allow growth)
      const newX = Math.max(0, e.clientX / zoomScale - dragStartOffset.current.x);
      const newY = Math.max(0, e.clientY / zoomScale - dragStartOffset.current.y);
      setClassPositions(prev => ({
        ...prev,
        [draggingClass]: { x: newX, y: newY }
      }));
    };

    const handleMouseUp = () => {
      setDraggingClass(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClass, zoomScale]);

  // Window listeners for dragging connection lines
  useEffect(() => {
    if (!connectingSource) return;

    const handleMouseMove = (e) => {
      const canvasEl = document.getElementById('uml-canvas-container');
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        setConnectionCurrent({
          x: (e.clientX - rect.left + canvasEl.scrollLeft) / zoomScale,
          y: (e.clientY - rect.top + canvasEl.scrollTop) / zoomScale
        });
      }
    };

    const handleMouseUp = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      let targetClass = null;
      const cards = document.querySelectorAll('.uml-class-card');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          const name = card.getAttribute('data-classname');
          if (name && name !== connectingSource) {
            targetClass = name;
            break;
          }
        }
      }

      if (targetClass) {
        setNewConnectionData({ source: connectingSource, target: targetClass });
        setNewRelationType('extends');
        setIsConnectionDialogOpen(true);
      }

      setConnectingSource(null);
      setConnectionStart(null);
      setConnectionCurrent(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectingSource, zoomScale]);

  const handlePortMouseDown = (e, className, side) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    const canvasEl = document.getElementById('uml-canvas-container');
    if (canvasEl) {
      const canvasRect = canvasEl.getBoundingClientRect();
      const startX = (rect.left + rect.width / 2 - canvasRect.left + canvasEl.scrollLeft) / zoomScale;
      const startY = (rect.top + rect.height / 2 - canvasRect.top + canvasEl.scrollTop) / zoomScale;
      
      setConnectingSource(className);
      setConnectionStart({ x: startX, y: startY, side });
      setConnectionCurrent({ x: startX, y: startY });
    }
  };

  const handleConfirmConnection = () => {
    const { source, target } = newConnectionData;
    if (!source || !target) return;

    const sourceIdx = umlClasses.findIndex(c => c.title === source);
    if (sourceIdx !== -1) {
      const sourceClass = umlClasses[sourceIdx];
      const fieldName = newFieldName.trim() || `${target.charAt(0).toLowerCase() + target.slice(1)}`;
      
      let newClasses = [...umlClasses];
      
      if (newRelationType === 'extends') {
        newClasses = umlClasses.map((c, idx) => {
          if (idx === sourceIdx) {
            if (c.type === 'interface') {
              return { ...c, extends: null, extendsInterfaces: [...(c.extendsInterfaces || []), target] };
            }
            return { ...c, extends: target };
          }
          return c;
        });
      } else if (newRelationType === 'implements') {
        const implementsList = sourceClass.implements || [];
        if (!implementsList.includes(target)) {
          newClasses = umlClasses.map((c, idx) => {
            if (idx === sourceIdx) return { ...c, implements: [...implementsList, target] };
            return c;
          });
        }
      } else if (newRelationType === 'composition' || newRelationType === 'aggregation' || newRelationType === 'association') {
        const newAttributes = [
          ...sourceClass.attributes,
          {
            name: fieldName,
            type: target,
            visibility: newRelationType === 'association' ? 'public' : 'private',
            isStatic: false
          }
        ];
        
        let newMethods = [...sourceClass.methods];
        if (newRelationType === 'composition') {
          // Look for existing constructor
          const constrIdx = newMethods.findIndex(m => m.returnType === 'constructor');
          if (constrIdx !== -1) {
            const currentBody = newMethods[constrIdx].body || '';
            newMethods[constrIdx] = {
              ...newMethods[constrIdx],
              body: currentBody.trim() 
                ? currentBody.replace(/\s*$/, '') + `\n        this.${fieldName} = new ${target}();\n    `
                : `\n        this.${fieldName} = new ${target}();\n    `
            };
          } else {
            // Create a default constructor
            newMethods.push({
              name: sourceClass.title,
              returnType: 'constructor',
              visibility: 'public',
              isStatic: false,
              isAbstract: false,
              parameters: [],
              body: `\n        this.${fieldName} = new ${target}();\n    `
            });
          }
        }
        
        newClasses = umlClasses.map((c, idx) => {
          if (idx === sourceIdx) return { ...c, attributes: newAttributes, methods: newMethods };
          return c;
        });
      } else if (newRelationType === 'dependency') {
        // Add dependency method parameter
        const newMethods = [
          ...sourceClass.methods,
          {
            name: `use${target}`,
            returnType: 'void',
            visibility: 'public',
            isStatic: false,
            isAbstract: false,
            parameters: [{ type: target, name: fieldName }],
            body: `\n        // Dependency: USES-A relationship with ${target}\n        System.out.println("Using " + ${fieldName});\n    `
          }
        ];
        newClasses = umlClasses.map((c, idx) => {
          if (idx === sourceIdx) return { ...c, methods: newMethods };
          return c;
        });
      }

      const err = validateProposedClasses(newClasses);
      if (err) {
        alert(`Invalid Relationship Connection: ${err}`);
        return;
      }

      handleUmlClassesChange(newClasses);
    }

    setIsConnectionDialogOpen(false);
    setNewConnectionData({ source: '', target: '' });
  };

  // Math functions for SVG arrow routes
  const getEstimatedHeight = (title) => {
    const c = umlClasses.find(x => x.title === title);
    if (!c) return 300;
    const attrLen = c.attributes?.length || 0;
    const methLen = c.methods?.length || 0;
    return 120 + attrLen * 34 + methLen * 34;
  };

  const getEstimatedCompressedHeight = (title) => {
    const c = umlClasses.find(x => x.title === title);
    if (!c) return 180;
    const attrLen = c.attributes?.length || 0;
    const methLen = c.methods?.length || 0;
    return 80 + attrLen * 20 + methLen * 20;
  };

  const getBestConnectionPoints = (posA, posB, useCompressed = false, allRelations = [], currentRelation = null) => {
    if (!posA || !posB) return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    const classA = umlClasses.find(x => x.title === posA.title);
    const classB = umlClasses.find(x => x.title === posB.title);
    
    // Attempt to query actual DOM elements
    const selectorA = useCompressed ? `.uml-preview-card[data-classname="${posA.title}"]` : `.uml-class-card[data-classname="${posA.title}"]`;
    const selectorB = useCompressed ? `.uml-preview-card[data-classname="${posB.title}"]` : `.uml-class-card[data-classname="${posB.title}"]`;
    const elA = document.querySelector(selectorA);
    const elB = document.querySelector(selectorB);
    
    const wA = elA ? elA.offsetWidth : (classA ? (useCompressed ? calculateCompressedCardWidth(classA) : calculateCardWidth(classA)) : 280);
    const wB = elB ? elB.offsetWidth : (classB ? (useCompressed ? calculateCompressedCardWidth(classB) : calculateCardWidth(classB)) : 280);
    const hA = elA ? elA.offsetHeight : (useCompressed ? getEstimatedCompressedHeight(posA.title) : getEstimatedHeight(posA.title));
    const hB = elB ? elB.offsetHeight : (useCompressed ? getEstimatedCompressedHeight(posB.title) : getEstimatedHeight(posB.title));

    const anchorsA = [
      { x: posA.x + wA / 2, y: posA.y, side: 'top' },
      { x: posA.x + wA / 2, y: posA.y + hA, side: 'bottom' },
      { x: posA.x, y: posA.y + hA / 2, side: 'left' },
      { x: posA.x + wA, y: posA.y + hA / 2, side: 'right' }
    ];

    const anchorsB = [
      { x: posB.x + wB / 2, y: posB.y, side: 'top' },
      { x: posB.x + wB / 2, y: posB.y + hB, side: 'bottom' },
      { x: posB.x, y: posB.y + hB / 2, side: 'left' },
      { x: posB.x + wB, y: posB.y + hB / 2, side: 'right' }
    ];

    let minDist = Infinity;
    let bestA = anchorsA[0];
    let bestB = anchorsB[0];

    for (const a of anchorsA) {
      for (const b of anchorsB) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          bestA = a;
          bestB = b;
        }
      }
    }

    // Distribute connections if multiple share same target side
    if (allRelations && allRelations.length > 0) {
      const targetRelations = allRelations.filter(r => r.target === posB.title);
      const sameSideSources = [];
      
      targetRelations.forEach(r => {
        const srcClass = umlClasses.find(c => c.title === r.source);
        if (!srcClass) return;
        const srcPos = classPositions[r.source];
        if (!srcPos) return;
        
        const elSrc = document.querySelector(useCompressed ? `.uml-preview-card[data-classname="${r.source}"]` : `.uml-class-card[data-classname="${r.source}"]`);
        const wSrc = elSrc ? elSrc.offsetWidth : (useCompressed ? calculateCompressedCardWidth(srcClass) : calculateCardWidth(srcClass));
        const hSrc = elSrc ? elSrc.offsetHeight : (useCompressed ? getEstimatedCompressedHeight(r.source) : getEstimatedHeight(r.source));
        const srcCenter = { x: srcPos.x + wSrc / 2, y: srcPos.y + hSrc / 2 };
        
        let closestSide = 'top';
        let minSideDist = Infinity;
        
        anchorsB.forEach(anchor => {
          const dx = anchor.x - srcCenter.x;
          const dy = anchor.y - srcCenter.y;
          const dist = dx * dx + dy * dy;
          if (dist < minSideDist) {
            minSideDist = dist;
            closestSide = anchor.side;
          }
        });
        
        if (closestSide === bestB.side) {
          const relId = `${r.source}_${r.target}_${r.type}_${r.fieldName || r.methodName || ''}`;
          sameSideSources.push(relId);
        }
      });
      
      sameSideSources.sort();
      
      const currentRelId = currentRelation 
        ? `${currentRelation.source}_${currentRelation.target}_${currentRelation.type}_${currentRelation.fieldName || currentRelation.methodName || ''}`
        : `${posA.title}_${posB.title}_extends_`;
      
      const sourceIdx = sameSideSources.indexOf(currentRelId);
      const totalCount = sameSideSources.length;
      
      if (totalCount > 1 && sourceIdx !== -1) {
        const factor = (sourceIdx + 1) / (totalCount + 1);
        if (bestB.side === 'top' || bestB.side === 'bottom') {
          bestB = {
            ...bestB,
            x: posB.x + wB * factor
          };
        } else {
          bestB = {
            ...bestB,
            y: posB.y + hB * factor
          };
        }
      }
    }

    // Distribute connections if multiple share same source side
    if (allRelations && allRelations.length > 0) {
      const sourceRelations = allRelations.filter(r => r.source === posA.title);
      const sameSideTargets = [];
      
      sourceRelations.forEach(r => {
        const destClass = umlClasses.find(c => c.title === r.target);
        if (!destClass) return;
        const destPos = classPositions[r.target];
        if (!destPos) return;
        
        const elDest = document.querySelector(useCompressed ? `.uml-preview-card[data-classname="${r.target}"]` : `.uml-class-card[data-classname="${r.target}"]`);
        const wDest = elDest ? elDest.offsetWidth : (useCompressed ? calculateCompressedCardWidth(destClass) : calculateCardWidth(destClass));
        const hDest = elDest ? elDest.offsetHeight : (useCompressed ? getEstimatedCompressedHeight(r.target) : getEstimatedHeight(r.target));
        const destCenter = { x: destPos.x + wDest / 2, y: destPos.y + hDest / 2 };
        
        let closestSide = 'top';
        let minSideDist = Infinity;
        
        anchorsA.forEach(anchor => {
          const dx = anchor.x - destCenter.x;
          const dy = anchor.y - destCenter.y;
          const dist = dx * dx + dy * dy;
          if (dist < minSideDist) {
            minSideDist = dist;
            closestSide = anchor.side;
          }
        });
        
        if (closestSide === bestA.side) {
          const relId = `${r.source}_${r.target}_${r.type}_${r.fieldName || r.methodName || ''}`;
          sameSideTargets.push(relId);
        }
      });
      
      sameSideTargets.sort();
      
      const currentRelId = currentRelation 
        ? `${currentRelation.source}_${currentRelation.target}_${currentRelation.type}_${currentRelation.fieldName || currentRelation.methodName || ''}`
        : `${posA.title}_${posB.title}_extends_`;
      
      const targetIdx = sameSideTargets.indexOf(currentRelId);
      const totalCount = sameSideTargets.length;
      
      if (totalCount > 1 && targetIdx !== -1) {
        const factor = (targetIdx + 1) / (totalCount + 1);
        if (bestA.side === 'top' || bestA.side === 'bottom') {
          bestA = {
            ...bestA,
            x: posA.x + wA * factor
          };
        } else {
          bestA = {
            ...bestA,
            y: posA.y + hA * factor
          };
        }
      }
    }

    return { start: bestA, end: bestB };
  };

  const getBezierPath = (start, end) => {
    const dx = Math.abs(start.x - end.x);
    const dy = Math.abs(start.y - end.y);
    const offset = Math.min(100, Math.max(30, (dx + dy) * 0.2));

    let cp1 = { x: start.x, y: start.y };
    let cp2 = { x: end.x, y: end.y };

    if (start.side === 'right') cp1.x += offset;
    else if (start.side === 'left') cp1.x -= offset;
    else if (start.side === 'top') cp1.y -= offset;
    else if (start.side === 'bottom') cp1.y += offset;

    if (end.side === 'right') cp2.x += offset;
    else if (end.side === 'left') cp2.x -= offset;
    else if (end.side === 'top') cp2.y -= offset;
    else if (end.side === 'bottom') cp2.y += offset;

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  };

  const getTempPath = (start, current) => {
    const dx = Math.abs(start.x - current.x);
    const dy = Math.abs(start.y - current.y);
    const offset = Math.min(100, Math.max(30, (dx + dy) * 0.2));

    let cp1 = { x: start.x, y: start.y };
    if (start.side === 'right') cp1.x += offset;
    else if (start.side === 'left') cp1.x -= offset;
    else if (start.side === 'top') cp1.y -= offset;
    else if (start.side === 'bottom') cp1.y += offset;

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${current.x} ${current.y}, ${current.x} ${current.y}`;
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setIsEditorReady(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsEditorReady(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Refs relocated to the top of the component

  // Sync editor values when tab changes or state updates to avoid stale values
  useEffect(() => {
    if (isTypingRef.current) return;
    
    const clean = (str) => (str || "").replace(/\r\n/g, "\n").trim();
    
    if (activeTab === 'uml') {
      if (umlEditorRef.current) {
        try {
          const currentVal = umlEditorRef.current.getValue();
          if (clean(currentVal) !== clean(code)) {
            umlEditorRef.current.setValue(code);
          }
        } catch (e) {
          console.warn("Failed to sync UML editor (likely disposed):", e);
        }
      }
    } else if (activeTab === 'runner') {
      if (execEditorRef.current) {
        try {
          const currentVal = execEditorRef.current.getValue();
          if (clean(currentVal) !== clean(code)) {
            execEditorRef.current.setValue(code);
          }
        } catch (e) {
          console.warn("Failed to sync Exec editor (likely disposed):", e);
        }
      }
      if (runnerEditorRef.current) {
        try {
          const currentVal = runnerEditorRef.current.getValue();
          if (clean(currentVal) !== clean(mainCode)) {
            runnerEditorRef.current.setValue(mainCode);
          }
        } catch (e) {
          console.warn("Failed to sync Runner editor (likely disposed):", e);
        }
      }
    }
  }, [activeTab, code, mainCode]);

  const getAttributeTypes = (currentType) => {
    const baseTypes = ['int', 'double', 'float', 'boolean', 'char', 'String'];
    const customClassTypes = umlClasses.map(c => c.title);
    const combined = [...baseTypes, ...customClassTypes];
    if (currentType && !combined.includes(currentType)) {
      combined.push(currentType);
    }
    return combined;
  };

  const getMethodReturnTypes = (currentType) => {
    if (currentType === 'constructor') {
      return ['constructor'];
    }
    const baseTypes = ['void', 'int', 'double', 'float', 'boolean', 'char', 'String'];
    const customClassTypes = umlClasses.map(c => c.title);
    const combined = [...baseTypes, ...customClassTypes];
    if (currentType && !combined.includes(currentType)) {
      combined.push(currentType);
    }
    return combined;
  };

  // Sync Code -> UML
  const handleCodeChange = (newCode) => {
    isTypingRef.current = true;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 1000);

    setCode(newCode);

    const err = checkJavaSyntax(newCode);
    setSyntaxError(err);

    if (internalUpdateRef.current) return;
    if (err) return;

    try {
      const parsedClasses = javaToUmlClasses(newCode);
      setUmlClasses(parsedClasses);
    } catch (err) {
      console.warn('Failed to parse Java code to UML:', err);
      setSyntaxError({ error: err.message, line: 1 });
    }
  };

  // Sync UML -> Code
  const handleUmlClassesChange = (newClasses) => {
    setUmlClasses(newClasses);
    internalUpdateRef.current = true;
    const generatedCode = umlClassesToJava(newClasses);
    setCode(generatedCode);
    setTimeout(() => {
      internalUpdateRef.current = false;
    }, 50);

    if (umlEditorRef.current) {
      const currentVal = umlEditorRef.current.getValue();
      if (currentVal !== generatedCode) {
        umlEditorRef.current.setValue(generatedCode);
      }
    }
    if (execEditorRef.current) {
      const currentVal = execEditorRef.current.getValue();
      if (currentVal !== generatedCode) {
        execEditorRef.current.setValue(generatedCode);
      }
    }
  };

  const loadExample = (idx) => {
    setActiveExampleIndex(idx);
    const ex = EXAMPLES[idx];
    setClassPositions({}); // Clear positions so examples position correctly
    setCode(ex.code);
    setSyntaxError(null);
    setUmlClasses(javaToUmlClasses(ex.code));
    setMainCode(ex.mainCode);

    if (umlEditorRef.current) {
      umlEditorRef.current.setValue(ex.code);
    }
    if (execEditorRef.current) {
      execEditorRef.current.setValue(ex.code);
    }
    if (runnerEditorRef.current) {
      runnerEditorRef.current.setValue(ex.mainCode);
    }
  };

  // Class Level Operations
  const addClass = () => {
    const newClassName = `NewClass${umlClasses.length + 1}`;
    const newClasses = [
      ...umlClasses,
      { title: newClassName, abstract: false, extends: null, extendsInterfaces: [], attributes: [], methods: [], type: 'class', implements: [] }
    ];
    handleUmlClassesChange(newClasses);
  };

  const deleteClass = (classIdx) => {
    const classToDelete = umlClasses[classIdx];
    const newClasses = umlClasses
      .filter((_, idx) => idx !== classIdx)
      .map(c => {
        if (c.extends === classToDelete.title) {
          return { ...c, extends: null };
        }
        return c;
      });
    handleUmlClassesChange(newClasses);
  };

  const updateClassExtends = (classIdx, parentName) => {
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) {
        if (c.type === 'interface') {
          // Interfaces use extendsInterfaces, but we sync both just in case
          return { ...c, extends: null, extendsInterfaces: parentName ? [parentName] : [] };
        }
        return { ...c, extends: parentName };
      }
      return c;
    });
    const err = validateProposedClasses(newClasses);
    if (err) {
      alert(`Invalid Inheritance: ${err}`);
      return;
    }
    handleUmlClassesChange(newClasses);
  };

  const updateClassAbstract = (classIdx, isAbstract) => {
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, abstract: isAbstract };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  const updateClassType = (classIdx, newType) => {
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) {
        let isAbstract = c.abstract;
        let finalType = newType;
        let ext = c.extends;
        let extInterfaces = c.extendsInterfaces || [];
        let impls = c.implements || [];

        if (newType === 'interface') {
          isAbstract = false;
          finalType = 'interface';
          // Convert implements list to extendsInterfaces list for interface
          if (impls.length > 0) {
            extInterfaces = [...impls];
          }
          impls = [];
          ext = null;
        } else if (newType === 'abstract') {
          finalType = 'class';
          isAbstract = true;
          // Convert extendsInterfaces list to implements list for class
          if (extInterfaces.length > 0) {
            impls = [...extInterfaces];
          }
          extInterfaces = [];
          ext = null;
        } else {
          finalType = 'class';
          isAbstract = false;
          if (extInterfaces.length > 0) {
            impls = [...extInterfaces];
          }
          extInterfaces = [];
          ext = null;
        }

        return { 
          ...c, 
          type: finalType, 
          abstract: isAbstract,
          extends: ext,
          extendsInterfaces: extInterfaces,
          implements: impls
        };
      }
      return c;
    });
    const err = validateProposedClasses(newClasses);
    if (err) {
      alert(`Invalid Type Change: ${err}`);
      return;
    }
    handleUmlClassesChange(newClasses);
  };

  const updateClassImplements = (classIdx, implementsList) => {
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, implements: implementsList };
      return c;
    });
    const err = validateProposedClasses(newClasses);
    if (err) {
      alert(`Invalid Implementation: ${err}`);
      return;
    }
    handleUmlClassesChange(newClasses);
  };

  const updateClassTitle = (classIdx, newTitle) => {
    const oldTitle = umlClasses[classIdx].title;
    
    // Rename key in classPositions to preserve coordinate state
    if (classPositions[oldTitle]) {
      setClassPositions(prev => {
        const next = { ...prev };
        next[newTitle] = next[oldTitle];
        delete next[oldTitle];
        return next;
      });
    }

    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) {
        const updatedMethods = c.methods.map(m => {
          if (m.returnType === 'constructor' || m.name === oldTitle) {
            return { ...m, name: newTitle };
          }
          return m;
        });
        return { ...c, title: newTitle, methods: updatedMethods };
      }
      
      let updatedExtendsInterfaces = c.extendsInterfaces || [];
      if (updatedExtendsInterfaces.includes(oldTitle)) {
        updatedExtendsInterfaces = updatedExtendsInterfaces.map(x => x === oldTitle ? newTitle : x);
      }
      
      let updatedImplements = c.implements || [];
      if (updatedImplements.includes(oldTitle)) {
        updatedImplements = updatedImplements.map(x => x === oldTitle ? newTitle : x);
      }

      return {
        ...c,
        extends: c.extends === oldTitle ? newTitle : c.extends,
        extendsInterfaces: updatedExtendsInterfaces,
        implements: updatedImplements
      };
    });
    handleUmlClassesChange(newClasses);
  };

  // Attribute Operations
  const addAttribute = (classIdx) => {
    const targetClass = umlClasses[classIdx];
    const newAttributes = [
      ...targetClass.attributes,
      { name: `newAttr${targetClass.attributes.length + 1}`, type: 'int', visibility: 'private', isStatic: false }
    ];
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, attributes: newAttributes };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  const deleteAttribute = (classIdx, attrIdx) => {
    const targetClass = umlClasses[classIdx];
    const newAttributes = targetClass.attributes.filter((_, i) => i !== attrIdx);
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, attributes: newAttributes };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  const updateAttribute = (classIdx, attrIdx, fields) => {
    const targetClass = umlClasses[classIdx];
    const newAttributes = targetClass.attributes.map((attr, i) => {
      if (i === attrIdx) return { ...attr, ...fields };
      return attr;
    });
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, attributes: newAttributes };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  // Method Operations
  const addMethod = (classIdx) => {
    const targetClass = umlClasses[classIdx];
    const newMethods = [
      ...targetClass.methods,
      { name: `newMethod${targetClass.methods.length + 1}`, returnType: 'void', visibility: 'public', isStatic: false, isAbstract: false, parameters: [], body: '\n        ' }
    ];
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, methods: newMethods };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  const deleteMethod = (classIdx, methodIdx) => {
    const targetClass = umlClasses[classIdx];
    const newMethods = targetClass.methods.filter((_, i) => i !== methodIdx);
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, methods: newMethods };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  const updateMethod = (classIdx, methodIdx, fields) => {
    const targetClass = umlClasses[classIdx];
    const newMethods = targetClass.methods.map((method, i) => {
      if (i === methodIdx) return { ...method, ...fields };
      return method;
    });
    const newClasses = umlClasses.map((c, idx) => {
      if (idx === classIdx) return { ...c, methods: newMethods };
      return c;
    });
    handleUmlClassesChange(newClasses);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setTerminalOutput('');
    setIsWaitingForInput(false);
    setCurrentInputVal('');
    
    try {
      const combinedCode = code + "\n\n// === RUNNER_SECTION_START ===\n\n" + mainCode;
      
      const onStdout = (text) => {
        setTerminalOutput(prev => prev + text);
      };
      
      const onReadInput = () => {
        return new Promise((resolve) => {
          setIsWaitingForInput(true);
          inputResolverRef.current = resolve;
        });
      };
      
      await executeCodeAsync(combinedCode, 'java', onStdout, onReadInput);
    } catch (err) {
      setTerminalOutput(prev => prev + `\n❌ COMPILATION / RUNTIME ERROR: ${err.message}\n`);
    } finally {
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
  };

  const handleInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const val = currentInputVal;
      setTerminalOutput(prev => prev + val + '\n');
      setCurrentInputVal('');
      setIsWaitingForInput(false);
      if (inputResolverRef.current) {
        inputResolverRef.current(val);
      }
    }
  };

  const handleDownloadPreviewPng = async () => {
    try {
      const element = document.getElementById('uml-preview-capture-content');
      if (!element) return;
      
      const oldScale = previewZoomScale;
      setPreviewZoomScale(1.0);
      
      // Wait for React to apply the scale reset
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      setPreviewZoomScale(oldScale);

      const link = document.createElement('a');
      link.download = 'uml_diagram.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting UML to PNG:', err);
      alert('Failed to generate PNG of UML diagram: ' + err.message);
    }
  };



  const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : 800;
  const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : 600;
  const dynamicMinZoom = parseFloat(Math.min(0.4, Math.max(0.1, Math.min(containerW / canvasDim.width, containerH / canvasDim.height))).toFixed(2));

  const previewContainerW = previewCanvasContainerRef.current ? previewCanvasContainerRef.current.clientWidth : 1000;
  const previewContainerH = previewCanvasContainerRef.current ? previewCanvasContainerRef.current.clientHeight : 800;
  const dynamicPreviewMinZoom = parseFloat(Math.min(0.4, Math.max(0.1, Math.min(previewContainerW / canvasDim.width, previewContainerH / canvasDim.height))).toFixed(2));

  return (
    <>
      <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        style: {
          borderRadius: '24px',
          background: 'var(--background-paper)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--divider)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          height: '95vh',
          maxHeight: '95vh',
          width: '95vw',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '12px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SyncIcon style={{ color: 'var(--primary-main)' }} />
          <Typography variant="h6" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif' }}>
            Interactive Java OOP & UML Playground
          </Typography>
        </Box>

        {/* Dialog Switcher Tabs */}
        <Box style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => {
              setActiveTab('uml');
              umlEditorRef.current = null;
              execEditorRef.current = null;
              runnerEditorRef.current = null;
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'uml' ? 'var(--primary-main)' : 'transparent',
              color: activeTab === 'uml' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 850,
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            2D Visual Class Map
          </button>
          <button
            onClick={() => {
              setActiveTab('runner');
              umlEditorRef.current = null;
              execEditorRef.current = null;
              runnerEditorRef.current = null;
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'runner' ? 'var(--primary-main)' : 'transparent',
              color: activeTab === 'runner' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 850,
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            Interactive Code Runner
          </button>
        </Box>

        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', marginRight: '8px' }}>
          <IconButton size="small" onClick={handleDownloadCode} title="Download Java File" style={{ color: 'var(--success-main)' }}>
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => fileInputRef.current?.click()} title="Import Java File" style={{ color: 'var(--orange-500)' }}>
            <UploadIcon fontSize="small" />
          </IconButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCode}
            accept=".java,.txt"
            style={{ display: 'none' }}
          />
        </Box>

        <IconButton onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent style={{ padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box id="split-container" style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, width: '100%', alignItems: 'stretch', position: 'relative', minHeight: 0 }}>
          {/* Left Pane: Code Editor */}
          <Box style={{ width: `${splitPercent}%`, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', height: '100%', minHeight: 0 }}>
            {activeTab === 'runner' ? (
              <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: 0 }}>
                {/* Top: Class Definitions */}
                <Box style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Class Definitions (OOP Structures)
                  </Typography>
                  <Box style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    flexGrow: 1,
                    minHeight: 0,
                    width: '100%',
                    position: 'relative'
                  }}>
                    <Editor
                      key="runner-classes-editor"
                      height="100%"
                      language="java"
                      defaultValue={code}
                      onMount={(editor) => { execEditorRef.current = editor; }}
                      onChange={(val) => handleCodeChange(val || '')}
                      theme={isDarkMode ? 'vs-dark' : 'light'}
                      options={{
                        fontSize: 12,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 8, bottom: 8 },
                        lineNumbersMinChars: 3
                      }}
                    />
                  </Box>
                </Box>

                {/* Bottom: Main test runner function */}
                <Box style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Main Executable (Test Client)
                  </Typography>
                  <Box style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1.5px solid var(--primary-main)',
                    boxShadow: '0 0 15px rgba(61, 92, 255, 0.15)',
                    flexGrow: 1,
                    minHeight: 0,
                    position: 'relative'
                  }}>
                    <Editor
                      key="runner-main-editor"
                      height="100%"
                      language="java"
                      defaultValue={mainCode}
                      onMount={(editor) => { runnerEditorRef.current = editor; }}
                      onChange={(val) => {
                        isTypingRef.current = true;
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => {
                          isTypingRef.current = false;
                        }, 1000);
                        setMainCode(val || '');
                      }}
                      theme={isDarkMode ? 'vs-dark' : 'light'}
                      options={{
                        fontSize: 13,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 10, bottom: 10 },
                        lineNumbersMinChars: 3
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            ) : (
              // Tab 1: Full height editor
              <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Class Source Code (Java)
                </Typography>
                <Box style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#fffffe',
                  boxShadow: '0 4px 25px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  minHeight: 0,
                  width: '100%'
                }}>
                  {/* Editor mockup header bar */}
                  <Box style={{
                    background: isDarkMode ? '#252526' : '#f3f3f3',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: isDarkMode ? '1px solid #2d2d2d' : '1px solid #e2e2e2'
                  }}>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CodeIcon style={{ color: 'var(--primary-main)', fontSize: '1.1rem' }} />
                      <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
                        BankAccount.java
                      </Typography>
                    </Box>
                    <Box style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></span>
                    </Box>
                  </Box>
                  <Box style={{ flexGrow: 1, position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
                    {isEditorReady ? (
                      <Editor
                        key="uml-editor"
                        height="100%"
                        language="java"
                        defaultValue={code}
                        onMount={(editor) => { umlEditorRef.current = editor; }}
                        onChange={(val) => handleCodeChange(val || '')}
                        theme={isDarkMode ? 'vs-dark' : 'light'}
                        options={{
                          fontSize: 13,
                          minimap: { enabled: false },
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          padding: { top: 12, bottom: 12 },
                          lineNumbersMinChars: 3
                        }}
                      />
                    ) : (
                      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                        <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                          Loading Editor...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* Draggable Divider */}
          <Box
            onMouseDown={(e) => {
              e.preventDefault();
              isDraggingSplitRef.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
            style={{
              width: '8px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              marginLeft: '-4px',
              marginRight: '-4px',
            }}
            sx={{
              '&:hover, &:active': {
                backgroundColor: 'var(--primary-main)',
              },
              '&::after': {
                content: '""',
                width: '2px',
                height: '40px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                borderRadius: '1px',
              }
            }}
          />

          {/* Right Pane: Swappable Tab Views (UML Class Lab vs. Code Runner) */}
          {activeTab === 'uml' ? (
            <Box style={{ width: `${100 - splitPercent}%`, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', height: '100%', minHeight: 0 }}>
              <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Interactive 2D UML Map
                </Typography>
                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 700 }}>
                  Drag card headers to arrange them • Drag border circles to link classes
                </Typography>
              </Box>

              {syntaxError && (
                <Box
                  style={{
                    background: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                    border: '1.5px solid #ef444460',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
                  }}
                >
                  <ErrorIcon style={{ color: '#ef4444', fontSize: '1.25rem' }} />
                  <Typography variant="body2" style={{ color: isDarkMode ? '#fca5a5' : '#b91c1c', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    <strong>Syntax Warning:</strong> {syntaxError.error}
                  </Typography>
                </Box>
              )}

              <Box style={{ flexGrow: 1, position: 'relative', height: '100%', width: '100%', minHeight: 0, overflow: 'hidden' }}>
                    {/* Floating Buttons in UML editor space */}
                    <Box style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 200, display: 'flex', gap: '8px' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          setPreviewZoomScale(zoomScale);
                          setIsPreviewOpen(true);
                        }}
                        startIcon={<PreviewIcon />}
                        style={{
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          background: 'rgba(28, 176, 246, 0.9)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          textTransform: 'none'
                        }}
                      >
                        Preview UML
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={addClass}
                        startIcon={<AddIcon />}
                        style={{
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          background: 'rgba(61, 92, 255, 0.9)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          textTransform: 'none'
                        }}
                      >
                        Create New Class
                      </Button>
                    </Box>

                <Paper
                  id="uml-canvas-container"
                  ref={canvasContainerRef}
                  onMouseDown={handleCanvasMouseDown}
                  elevation={0}
                  style={{
                    background: isDarkMode 
                      ? 'var(--background-default) linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)' 
                      : 'var(--background-default) linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    border: '1.5px solid var(--divider)',
                    borderRadius: '16px',
                    height: '100%',
                    width: '100%',
                    position: 'relative',
                    overflow: 'auto',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.15)',
                    cursor: 'grab'
                  }}
                >
                  {/* CSS styles injection */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    .uml-port {
                      position: absolute;
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      background-color: #1CB0F6;
                      border: 2.5px solid ${isDarkMode ? '#1E1E2F' : '#FFFFFF'};
                      cursor: crosshair;
                      z-index: 100;
                      transition: all 0.2s ease-in-out;
                      box-shadow: 0 0 5px rgba(28, 176, 246, 0.4);
                      opacity: 0;
                      pointer-events: none;
                    }
                    .uml-class-card:hover .uml-port {
                      opacity: 1;
                      pointer-events: auto;
                    }
                    .uml-port-top {
                      top: -6px;
                      left: 50%;
                      transform: translateX(-50%) scale(0.7);
                    }
                    .uml-class-card:hover .uml-port-top {
                      transform: translateX(-50%) scale(1);
                    }
                    .uml-port-bottom {
                      bottom: -6px;
                      left: 50%;
                      transform: translateX(-50%) scale(0.7);
                    }
                    .uml-class-card:hover .uml-port-bottom {
                      transform: translateX(-50%) scale(1);
                    }
                    .uml-port-left {
                      left: -6px;
                      top: 50%;
                      transform: translateY(-50%) scale(0.7);
                    }
                    .uml-class-card:hover .uml-port-left {
                      transform: translateY(-50%) scale(1);
                    }
                    .uml-port-right {
                      right: -6px;
                      top: 50%;
                      transform: translateY(-50%) scale(0.7);
                    }
                    .uml-class-card:hover .uml-port-right {
                      transform: translateY(-50%) scale(1);
                    }
                    .uml-port:hover {
                      background-color: #007bb5;
                      box-shadow: 0 0 12px #1CB0F6, 0 0 5px #1CB0F6;
                    }
                    .uml-port-top:hover {
                      transform: translateX(-50%) scale(1.4) !important;
                    }
                    .uml-port-bottom:hover {
                      transform: translateX(-50%) scale(1.4) !important;
                    }
                    .uml-port-left:hover {
                      transform: translateY(-50%) scale(1.4) !important;
                    }
                    .uml-port-right:hover {
                      transform: translateY(-50%) scale(1.4) !important;
                    }
                  `}} />

                  {/* Scroll container wrapper to preserve scroll bounds */}
                  <Box
                    style={{
                      width: `${(canvasDim.width + 200) * zoomScale}px`,
                      height: `${(canvasDim.height + 300) * zoomScale}px`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Virtual Canvas Box */}
                    <Box
                      style={{
                        width: `${canvasDim.width}px`,
                        height: `${canvasDim.height}px`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: `scale(${zoomScale})`,
                        transformOrigin: 'top left',
                        backgroundImage: isDarkMode
                          ? 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)'
                          : 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        backgroundColor: 'var(--background-default)'
                      }}
                    >
                    <svg
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 4,
                        overflow: 'visible'
                      }}
                    >
                    <defs>
                      {/* Generalization / Inheritance (Solid line with hollow closed triangle pointing to parent) */}
                      <marker
                        id="inheritance-arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto-start-reverse"
                      >
                        <polygon
                          points="0,1.5 9,5 0,8.5"
                          fill="var(--background-paper)"
                          stroke="var(--primary-main)"
                          strokeWidth="1.5"
                        />
                      </marker>

                      {/* Association (Solid line with open arrowhead pointing to target) */}
                      <marker
                        id="association-arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto-start-reverse"
                      >
                        <path
                          d="M 1,2 L 9,5 L 1,8"
                          fill="none"
                          stroke="#14b8a6"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </marker>

                      {/* Dependency (Dashed line with open arrowhead pointing to target) */}
                      <marker
                        id="dependency-arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto-start-reverse"
                      >
                        <path
                          d="M 1,2 L 9,5 L 1,8"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </marker>

                      {/* Composition (Solid line with solid/filled diamond at source end) */}
                      <marker
                        id="composition-diamond"
                        viewBox="0 0 16 10"
                        refX="0"
                        refY="5"
                        markerWidth="10"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <polygon points="0,5 8,1 16,5 8,9" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="1.5" />
                      </marker>

                      {/* Aggregation (Solid line with hollow diamond at source end) */}
                      <marker
                        id="aggregation-diamond"
                        viewBox="0 0 16 10"
                        refX="0"
                        refY="5"
                        markerWidth="10"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <polygon points="0,5 8,1 16,5 8,9" fill="var(--background-paper)" stroke="#6366f1" strokeWidth="1.8" />
                      </marker>

                      {/* Realization / Implementation (Dashed line with hollow closed triangle pointing to parent/interface) */}
                      <marker
                        id="realization-arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto-start-reverse"
                      >
                        <polygon
                          points="0,1.5 9,5 0,8.5"
                          fill="var(--background-paper)"
                          stroke="#10b981"
                          strokeWidth="1.8"
                        />
                      </marker>
                    </defs>

                    {(() => {
                      const relations = analyzeRelationships(umlClasses);
                      return relations.map((rel) => {
                        const sourcePos = classPositions[rel.source];
                        const targetPos = classPositions[rel.target];
                        if (sourcePos && targetPos) {
                          const pts = getBestConnectionPoints(
                            { title: rel.source, x: sourcePos.x, y: sourcePos.y },
                            { title: rel.target, x: targetPos.x, y: targetPos.y },
                            false,
                            relations,
                            rel
                          );
                        const pathData = getBezierPath(pts.start, pts.end);
                        
                        let strokeColor = '#8b5cf6';
                        let dashArray = 'none';
                        let markerStart = 'none';
                        let markerEnd = 'none';
                        
                        if (rel.type === 'extends') {
                          strokeColor = 'var(--primary-main)';
                          markerEnd = 'url(#inheritance-arrow)';
                        } else if (rel.type === 'implements') {
                          strokeColor = '#10b981';
                          dashArray = '4 4';
                          markerEnd = 'url(#realization-arrow)';
                        } else if (rel.type === 'composition') {
                          strokeColor = '#8b5cf6';
                          markerStart = 'url(#composition-diamond)';
                        } else if (rel.type === 'aggregation') {
                          strokeColor = '#6366f1';
                          markerStart = 'url(#aggregation-diamond)';
                        } else if (rel.type === 'association') {
                          strokeColor = '#14b8a6';
                          markerEnd = 'url(#association-arrow)';
                        } else if (rel.type === 'dependency') {
                          strokeColor = '#f59e0b';
                          dashArray = '4 4';
                          markerEnd = 'url(#dependency-arrow)';
                        }
                        
                        return (
                          <path
                            key={`${rel.type}-line-${rel.source}-${rel.target}-${rel.fieldName || ''}`}
                            d={pathData}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5"
                            strokeDasharray={dashArray}
                            markerStart={markerStart}
                            markerEnd={markerEnd}
                          />
                        );
                      }
                      return null;
                    });
                  })()}

                    {connectingSource && connectionStart && connectionCurrent && (
                      <path
                        d={getTempPath(connectionStart, connectionCurrent)}
                        fill="none"
                        stroke={isDarkMode ? '#1CB0F6' : '#007bb5'}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}
                  </svg>

                  {/* Absolute Draggable Cards */}
                  {umlClasses.map((umlClass, classIdx) => {
                    const pos = classPositions[umlClass.title] || {
                      x: 50 + (classIdx % 3) * 420,
                      y: 50 + Math.floor(classIdx / 3) * 460
                    };
                    return (
                      <Box
                        key={classIdx}
                        className="uml-class-card"
                        data-classname={umlClass.title}
                        style={{
                          position: 'absolute',
                          left: `${pos.x}px`,
                          top: `${pos.y}px`,
                          width: `${calculateCardWidth(umlClass)}px`,
                          border: `2px solid ${theme.palette.primary.main}80`,
                          borderRadius: '12px',
                          background: 'var(--background-paper)',
                          boxShadow: draggingClass === umlClass.title
                            ? '0 12px 30px rgba(0,0,0,0.35)'
                            : '0 4px 15px rgba(0,0,0,0.15)',
                          zIndex: draggingClass === umlClass.title ? 10 : 3,
                          transition: draggingClass === umlClass.title ? 'none' : 'box-shadow 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {/* Port circles for drag connecting */}
                        <div className="uml-port uml-port-top" onMouseDown={(e) => handlePortMouseDown(e, umlClass.title, 'top')} />
                        <div className="uml-port uml-port-bottom" onMouseDown={(e) => handlePortMouseDown(e, umlClass.title, 'bottom')} />
                        <div className="uml-port uml-port-left" onMouseDown={(e) => handlePortMouseDown(e, umlClass.title, 'left')} />
                        <div className="uml-port uml-port-right" onMouseDown={(e) => handlePortMouseDown(e, umlClass.title, 'right')} />

                        {/* Header Block (Class Title / Abstract / Extends) */}
                        <Box
                          style={{
                            background: 'rgba(var(--primary-main-rgb), 0.08)',
                            padding: '10px',
                            borderBottom: '1.5px solid var(--divider)',
                            cursor: draggingClass === umlClass.title ? 'grabbing' : 'grab',
                            userSelect: 'none'
                          }}
                          onMouseDown={(e) => {
                            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.closest('button') || e.target.closest('.MuiSelect-select')) {
                              return;
                            }
                            setDraggingClass(umlClass.title);
                            dragStartOffset.current = {
                              x: e.clientX / zoomScale - pos.x,
                              y: e.clientY / zoomScale - pos.y
                            };
                          }}
                        >
                          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <Select
                                size="small"
                                value={umlClass.type === 'interface' ? 'interface' : (umlClass.abstract ? 'abstract' : 'class')}
                                onChange={(e) => updateClassType(classIdx, e.target.value)}
                                style={{ height: '24px', fontSize: '0.72rem', fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: 'var(--primary-main)' }}
                                sx={{
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(28,176,246,0.2)'
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--primary-main)'
                                  }
                                }}
                              >
                                <MenuItem value="class" style={{ fontSize: '0.72rem', fontWeight: 700 }}>Class</MenuItem>
                                <MenuItem value="abstract" style={{ fontSize: '0.72rem', fontWeight: 700 }}>Abstract</MenuItem>
                                <MenuItem value="interface" style={{ fontSize: '0.72rem', fontWeight: 700 }}>Interface</MenuItem>
                              </Select>
                            </Box>

                            <IconButton size="small" onClick={() => deleteClass(classIdx)} style={{ color: 'var(--danger-main)', padding: '2px' }}>
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Box>

                          {umlClass.type === 'interface' ? (
                            <Typography variant="caption" style={{ color: '#10b981', fontWeight: 850, display: 'block', textAlign: 'center', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                              &lt;&lt;Interface&gt;&gt;
                            </Typography>
                          ) : (
                            umlClass.abstract && (
                              <Typography variant="caption" style={{ color: 'var(--primary-main)', fontWeight: 850, display: 'block', textAlign: 'center', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                                &lt;&lt;Abstract&gt;&gt;
                              </Typography>
                            )
                          )}

                          <input
                            type="text"
                            value={umlClass.title}
                            onChange={(e) => updateClassTitle(classIdx, e.target.value)}
                            style={{
                              width: '90%',
                              display: 'block',
                              margin: '4px auto',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1.5px dashed var(--primary-main)',
                              color: isDarkMode ? '#fff' : '#000',
                              textAlign: 'center',
                              fontSize: '0.98rem',
                              fontWeight: 800,
                              fontFamily: '"Outfit", sans-serif',
                              outline: 'none'
                            }}
                          />

                          {/* Extends (Connection) Dropdown */}
                          <Box style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem' }}>
                                extends
                              </Typography>
                              <Select
                                size="small"
                                value={umlClass.extends || 'none'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateClassExtends(classIdx, val === 'none' ? null : val);
                                }}
                                style={{ height: '22px', fontSize: '0.7rem', fontFamily: 'monospace' }}
                              >
                                <MenuItem value="none">None</MenuItem>
                                {umlClasses
                                  .filter(c => c.title !== umlClass.title)
                                  .map(c => (
                                    <MenuItem key={c.title} value={c.title}>{c.title}</MenuItem>
                                  ))
                                }
                              </Select>
                            </Box>

                            {umlClass.type !== 'interface' && (
                              <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem' }}>
                                  implements
                                </Typography>
                                <Select
                                  size="small"
                                  multiple
                                  value={umlClass.implements || []}
                                  onChange={(e) => {
                                    updateClassImplements(classIdx, e.target.value);
                                  }}
                                  renderValue={(selected) => selected.join(', ')}
                                  style={{ height: '22px', minWidth: '80px', fontSize: '0.7rem', fontFamily: 'monospace' }}
                                >
                                  {umlClasses
                                    .filter(c => c.type === 'interface' && c.title !== umlClass.title)
                                    .map(c => (
                                      <MenuItem key={c.title} value={c.title}>
                                        <Checkbox size="small" checked={(umlClass.implements || []).includes(c.title)} />
                                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{c.title}</span>
                                      </MenuItem>
                                    ))
                                  }
                                </Select>
                              </Box>
                            )}
                          </Box>
                        </Box>

                        {/* Attributes Block */}
                        <Box style={{ padding: '10px', borderBottom: '1.5px solid rgba(28,176,246,0.15)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                              Attributes (Fields)
                            </Typography>
                            <IconButton size="small" onClick={() => addAttribute(classIdx)} style={{ color: 'var(--primary-main)', padding: '2px' }}>
                              <AddIcon fontSize="inherit" />
                            </IconButton>
                          </Box>

                          {umlClass.attributes.map((attr, attrIdx) => (
                            <Box key={attrIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Box style={{ display: 'flex', gap: '4px', width: '100%', alignItems: 'center' }}>
                                <Select
                                  size="small"
                                  value={attr.visibility}
                                  onChange={(e) => updateAttribute(classIdx, attrIdx, { visibility: e.target.value })}
                                  style={{ height: '24px', fontSize: '0.72rem', fontFamily: 'monospace' }}
                                >
                                  <MenuItem value="public">+</MenuItem>
                                  <MenuItem value="private">-</MenuItem>
                                  <MenuItem value="protected">#</MenuItem>
                                </Select>
                                <Select
                                  size="small"
                                  value={attr.type}
                                  onChange={(e) => updateAttribute(classIdx, attrIdx, { type: e.target.value })}
                                  style={{
                                    height: '24px',
                                    fontSize: '0.72rem',
                                    fontFamily: 'monospace',
                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    color: isDarkMode ? '#ffffff' : '#1e1e2f',
                                    width: `${Math.max(70, (attr.type ? attr.type.length : 0) * 8 + 24)}px`,
                                    padding: 0
                                  }}
                                  sx={{
                                    '& .MuiSelect-select': {
                                      paddingTop: '2px',
                                      paddingBottom: '2px',
                                      paddingLeft: '6px',
                                      paddingRight: '20px'
                                    }
                                  }}
                                >
                                  {getAttributeTypes(attr.type).map(t => (
                                    <MenuItem key={t} value={t} style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{t}</MenuItem>
                                  ))}
                                </Select>
                                <input
                                  type="text"
                                  value={attr.name}
                                  placeholder="name"
                                  onChange={(e) => updateAttribute(classIdx, attrIdx, { name: e.target.value })}
                                  style={{
                                    flexGrow: 1,
                                    minWidth: '40px',
                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    color: isDarkMode ? '#ffffff' : '#1e1e2f',
                                    fontSize: '0.72rem',
                                    padding: '2px 4px',
                                    fontFamily: 'monospace',
                                    outline: 'none'
                                  }}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={attr.isStatic}
                                      onChange={(e) => updateAttribute(classIdx, attrIdx, { isStatic: e.target.checked })}
                                      sx={{ padding: 0 }}
                                    />
                                  }
                                  label="S"
                                  style={{ margin: 0 }}
                                  slotProps={{ typography: { style: { fontSize: '0.6rem', fontWeight: 800, marginLeft: '1px' } } }}
                                />
                                <IconButton size="small" onClick={() => deleteAttribute(classIdx, attrIdx)} style={{ color: 'var(--danger-main)', padding: '2px' }}>
                                  <DeleteIcon fontSize="inherit" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        {/* Methods Block */}
                        <Box style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                              Methods (Actions)
                            </Typography>
                            <IconButton size="small" onClick={() => addMethod(classIdx)} style={{ color: 'var(--primary-main)', padding: '2px' }}>
                              <AddIcon fontSize="inherit" />
                            </IconButton>
                          </Box>

                          {umlClass.methods.map((method, methodIdx) => (
                            <Box key={methodIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <Select
                                size="small"
                                value={method.visibility}
                                onChange={(e) => updateMethod(classIdx, methodIdx, { visibility: e.target.value })}
                                style={{ height: '24px', fontSize: '0.72rem', fontFamily: 'monospace' }}
                              >
                                <MenuItem value="public">+</MenuItem>
                                <MenuItem value="private">-</MenuItem>
                                <MenuItem value="protected">#</MenuItem>
                              </Select>
                              <Select
                                size="small"
                                value={method.returnType}
                                disabled={method.returnType === 'constructor'}
                                onChange={(e) => updateMethod(classIdx, methodIdx, { returnType: e.target.value })}
                                style={{
                                  height: '24px',
                                  fontSize: '0.72rem',
                                  fontFamily: 'monospace',
                                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                  borderRadius: '4px',
                                  color: isDarkMode ? '#ffffff' : '#1e1e2f',
                                  width: `${Math.max(70, (method.returnType ? method.returnType.length : 0) * 8 + 24)}px`,
                                  padding: 0
                                }}
                                sx={{
                                  '& .MuiSelect-select': {
                                    paddingTop: '2px',
                                    paddingBottom: '2px',
                                    paddingLeft: '6px',
                                    paddingRight: '20px'
                                  }
                                }}
                              >
                                {getMethodReturnTypes(method.returnType).map(t => (
                                  <MenuItem key={t} value={t} style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{t}</MenuItem>
                                ))}
                              </Select>
                              <input
                                type="text"
                                value={method.name}
                                placeholder="name"
                                onChange={(e) => updateMethod(classIdx, methodIdx, { name: e.target.value })}
                                style={{
                                  flexGrow: 1,
                                  minWidth: '40px',
                                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                  borderRadius: '4px',
                                  color: isDarkMode ? '#ffffff' : '#1e1e2f',
                                  fontSize: '0.72rem',
                                  padding: '2px 4px',
                                  fontFamily: 'monospace',
                                  outline: 'none'
                                }}
                              />
                              <Box style={{ display: 'flex', gap: '2px' }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={method.isStatic}
                                      onChange={(e) => updateMethod(classIdx, methodIdx, { isStatic: e.target.checked })}
                                      sx={{ padding: 0 }}
                                    />
                                  }
                                  label="S"
                                  style={{ margin: 0 }}
                                  slotProps={{ typography: { style: { fontSize: '0.6rem', fontWeight: 800 } } }}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={method.isAbstract}
                                      onChange={(e) => updateMethod(classIdx, methodIdx, { isAbstract: e.target.checked })}
                                      sx={{ padding: 0 }}
                                    />
                                  }
                                  label="A"
                                  style={{ margin: 0 }}
                                  slotProps={{ typography: { style: { fontSize: '0.6rem', fontWeight: 800 } } }}
                                />
                              </Box>
                              <IconButton size="small" onClick={() => deleteMethod(classIdx, methodIdx)} style={{ color: 'var(--danger-main)', padding: '2px' }}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                  </Box>
                </Box>
              </Paper>

              <Box
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--surface-glass)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--divider)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                  zIndex: 200
                }}
              >
                <IconButton 
                  size="small" 
                  disabled={zoomScale <= dynamicMinZoom}
                  onClick={() => {
                    const container = canvasContainerRef.current;
                    if (container) {
                      const mx = container.clientWidth / 2;
                      const my = container.clientHeight / 2;
                      const x_virtual = (container.scrollLeft + mx) / zoomScale;
                      const y_virtual = (container.scrollTop + my) / zoomScale;
                      zoomAnchorRef.current = { x_virtual, y_virtual, mx, my };
                    }
                    setZoomScale(prev => Math.max(dynamicMinZoom, prev - 0.1));
                  }}
                  style={{ color: zoomScale <= dynamicMinZoom ? 'var(--text-disabled)' : 'var(--text-primary)' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  disabled={zoomScale >= 2.0}
                  onClick={() => {
                    const container = canvasContainerRef.current;
                    if (container) {
                      const mx = container.clientWidth / 2;
                      const my = container.clientHeight / 2;
                      const x_virtual = (container.scrollLeft + mx) / zoomScale;
                      const y_virtual = (container.scrollTop + my) / zoomScale;
                      zoomAnchorRef.current = { x_virtual, y_virtual, mx, my };
                    }
                    setZoomScale(prev => Math.min(2.0, prev + 0.1));
                  }}
                  style={{ color: zoomScale >= 2.0 ? 'var(--text-disabled)' : 'var(--text-primary)' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Button 
                  size="small" 
                  onClick={() => {
                    const container = canvasContainerRef.current;
                    if (container) {
                      const mx = container.clientWidth / 2;
                      const my = container.clientHeight / 2;
                      const x_virtual = (container.scrollLeft + mx) / zoomScale;
                      const y_virtual = (container.scrollTop + my) / zoomScale;
                      zoomAnchorRef.current = { x_virtual, y_virtual, mx, my };
                    }
                    setZoomScale(1.0);
                  }}
                  style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'none', color: 'var(--primary-main)', minWidth: 0, padding: '2px 6px' }}
                >
                  Reset
                </Button>
              </Box>
        </Box>
      </Box>
          ) : (
            <Box style={{ width: `${100 - splitPercent}%`, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', height: '100%', minHeight: 0 }}>
              <Typography variant="subtitle2" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Interactive Java Console
              </Typography>

              <Paper
                elevation={0}
                style={{
                  background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                  border: '1.5px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '20px',
                  flexGrow: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Run button */}
                <Button
                  variant="contained"
                  fullWidth
                  disabled={isRunning}
                  onClick={handleRun}
                  startIcon={<PlayIcon />}
                  style={{
                    background: 'var(--primary-main)',
                    color: '#fff',
                    borderRadius: '12px',
                    fontWeight: 800,
                    textTransform: 'none',
                    padding: '8px 16px',
                    boxShadow: '0 4px 15px rgba(28, 176, 246, 0.25)'
                  }}
                >
                  {isRunning ? 'Running Java Simulation...' : 'Run Java Code'}
                </Button>

                {/* Output console terminal */}
                <Box style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
                  <Typography variant="caption" style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Console Output Terminal
                  </Typography>
                  <Paper
                    elevation={0}
                    style={{
                      flexGrow: 1,
                      padding: '16px',
                      backgroundColor: 'var(--code-bg)',
                      borderRadius: '16px',
                      border: '1px solid var(--code-border)',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '0.8rem',
                      color: 'var(--code-text-default)',
                      whiteSpace: 'pre-wrap',
                      overflowY: 'auto',
                      minHeight: 0,
                      boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start'
                    }}
                  >
                    <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                      {terminalOutput}
                      {isWaitingForInput && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <span style={{ color: '#FF9F43', fontWeight: 800 }}>{`> `}</span>
                          <input
                            type="text"
                            value={currentInputVal}
                            onChange={(e) => setCurrentInputVal(e.target.value)}
                            onKeyDown={handleInputSubmit}
                            autoFocus
                            placeholder="Type input and press Enter..."
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: '#3DDC97',
                              fontFamily: '"Roboto Mono", monospace',
                              fontSize: '0.82rem',
                              flexGrow: 1,
                              caretColor: '#3DDC97'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Paper>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {activeTab === 'uml' 
            ? '💡 Pro-tip: Edits in the code editor instantly sync to the 2D map. Changes to the UML cards also update the source code automatically without losing your custom method bodies!'
            : '💡 Pro-tip: You can write test code directly inside the runner tab on the left to interact with your classes, then click "Run Java Code" to see the output in the console!'
          }
        </Typography>
        <Button variant="outlined" onClick={onClose} style={{ borderRadius: '12px', fontWeight: 800 }}>
          Close
        </Button>
      </DialogActions>

      {/* Create Connection Dialog */}
      <Dialog
        open={isConnectionDialogOpen}
        onClose={() => setIsConnectionDialogOpen(false)}
        PaperProps={{
          style: {
            borderRadius: '16px',
            background: 'var(--background-paper)',
            border: '1px solid var(--divider)',
            padding: '16px',
            width: '400px'
          }
        }}
      >
        <DialogTitle style={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', paddingBottom: '8px' }}>
          Create Link from {newConnectionData.source}
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
          <Typography variant="body2" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Configure the relationship properties below:
          </Typography>

          {/* Target Class Dropdown */}
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography variant="caption" style={{ fontWeight: 850, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Target Class
            </Typography>
            <Select
              value={newConnectionData.target || ''}
              onChange={(e) => {
                const selectedTarget = e.target.value;
                setNewConnectionData(prev => ({ ...prev, target: selectedTarget }));
              }}
              fullWidth
              size="small"
              style={{ borderRadius: '8px' }}
            >
              {umlClasses
                .filter(c => c.title !== newConnectionData.source)
                .map(c => (
                  <MenuItem key={c.title} value={c.title}>{c.title}</MenuItem>
                ))
              }
            </Select>
          </Box>
          
          {/* Relationship Type Dropdown */}
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography variant="caption" style={{ fontWeight: 850, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Relationship Connection Type
            </Typography>
            <Select
              value={newRelationType}
              onChange={(e) => setNewRelationType(e.target.value)}
              fullWidth
              size="small"
              style={{ borderRadius: '8px' }}
            >
              <MenuItem value="extends">Inheritance (extends)</MenuItem>
              <MenuItem value="implements">Realization (implements)</MenuItem>
              <MenuItem value="composition">Composition (Has-A, instantiated in constructor)</MenuItem>
              <MenuItem value="aggregation">Aggregation (Has-A reference, private field)</MenuItem>
              <MenuItem value="association">Association (Has-A reference, public field)</MenuItem>
              <MenuItem value="dependency">Dependency (Uses-A parameter in new method)</MenuItem>
            </Select>
          </Box>

          {/* Conditional Variable/Parameter Input */}
          {newRelationType !== 'extends' && newRelationType !== 'implements' && (
            <TextField
              label="Variable / Parameter Name"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. engine"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          )}
        </DialogContent>
        <DialogActions style={{ padding: '8px 16px' }}>
          <Button onClick={() => setIsConnectionDialogOpen(false)} style={{ borderRadius: '8px', fontWeight: 800 }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmConnection} variant="contained" style={{ borderRadius: '8px', fontWeight: 800, background: 'var(--primary-main)', color: '#fff' }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>

    {/* Fullscreen UML Preview Dialog */}
    <Dialog
      open={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
      fullScreen
      PaperProps={{
        'data-theme': previewTheme,
        style: {
          background: 'var(--background-default)',
        }
      }}
    >
      <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--divider)' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PreviewIcon style={{ color: 'var(--primary-main)' }} />
          <Typography variant="h6" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: 'var(--text-primary)' }}>
            UML Diagram Fullscreen Preview
          </Typography>
        </Box>
        <Box style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Typography variant="body2" style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>
            Choose Theme:
          </Typography>
          <Select
            value={previewTheme}
            onChange={(e) => setPreviewTheme(e.target.value)}
            variant="outlined"
            size="small"
            style={{
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              background: 'var(--background-paper)',
              minWidth: '150px',
              height: '40px',
              border: '1px solid var(--divider)'
            }}
          >
            <MenuItem value="light">Default Light</MenuItem>
            <MenuItem value="dark">Default Dark</MenuItem>
            <MenuItem value="sepia">Warm Sepia</MenuItem>
            <MenuItem value="lava">Volcanic Lava</MenuItem>
            <MenuItem value="ocean">Deep Ocean</MenuItem>
            <MenuItem value="forest">Emerald Forest</MenuItem>
            <MenuItem value="amber">Solarized Amber</MenuItem>
            <MenuItem value="dracula">Dracula Vampire</MenuItem>
            <MenuItem value="amethyst">Royal Amethyst</MenuItem>
            <MenuItem value="nordic">Nordic Ice</MenuItem>
            <MenuItem value="mint">Frosted Mint</MenuItem>
            <MenuItem value="lavender">Soft Lavender</MenuItem>
            <MenuItem value="peach">Peach Cream</MenuItem>
            <MenuItem value="rose">Rose Gold</MenuItem>
            <MenuItem value="clay">Clay Slate</MenuItem>
          </Select>
          <Button variant="outlined" onClick={handleDownloadPreviewPng} style={{ borderRadius: '12px', fontWeight: 800 }}>
            Download PNG
          </Button>
          <Button variant="outlined" onClick={() => setIsPreviewOpen(false)} style={{ borderRadius: '12px', fontWeight: 800 }}>
            Close Preview
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent style={{ padding: 0, overflow: 'hidden', position: 'relative', height: '100%', width: '100%' }}>
        <Paper
          id="uml-preview-canvas-container"
          ref={previewCanvasContainerRef}
          onMouseDown={handlePreviewCanvasMouseDown}
          elevation={0}
          style={{
            background: 'var(--background-default)',
            height: '100%',
            width: '100%',
            position: 'relative',
            overflow: 'auto',
            cursor: 'grab'
          }}
        >
          {/* Virtual Canvas Box */}
          <Box
            style={{
              width: `${canvasDim.width * previewZoomScale}px`,
              height: `${canvasDim.height * previewZoomScale}px`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              id="uml-preview-capture-content"
              style={{
                width: `${canvasDim.width}px`,
                height: `${canvasDim.height}px`,
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `scale(${previewZoomScale})`,
                transformOrigin: 'top left',
                backgroundImage: 'linear-gradient(var(--divider) 1px, transparent 1px), linear-gradient(90deg, var(--divider) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundColor: 'var(--background-default)'
              }}
            >
              {/* SVG lines */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 4,
                  overflow: 'visible'
                }}
              >
                <defs>
                  {/* Generalization / Inheritance (Solid line with hollow closed triangle pointing to parent) */}
                  <marker
                    id="preview-inheritance-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <polygon
                      points="0,1.5 9,5 0,8.5"
                      fill="var(--background-paper)"
                      stroke="var(--primary-main)"
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Association (Solid line with open arrowhead pointing to target) */}
                  <marker
                    id="preview-association-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 1,2 L 9,5 L 1,8"
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </marker>

                  {/* Dependency (Dashed line with open arrowhead pointing to target) */}
                  <marker
                    id="preview-dependency-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 1,2 L 9,5 L 1,8"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                        />
                  </marker>

                  {/* Composition (Solid line with solid/filled diamond at source end) */}
                  <marker
                    id="preview-composition-diamond"
                    viewBox="0 0 16 10"
                    refX="0"
                    refY="5"
                    markerWidth="10"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <polygon points="0,5 8,1 16,5 8,9" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="1.5" />
                  </marker>

                  {/* Aggregation (Solid line with hollow diamond at source end) */}
                  <marker
                    id="preview-aggregation-diamond"
                    viewBox="0 0 16 10"
                    refX="0"
                    refY="5"
                    markerWidth="10"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <polygon points="0,5 8,1 16,5 8,9" fill="var(--background-paper)" stroke="#6366f1" strokeWidth="1.8" />
                  </marker>

                  {/* Realization / Implementation (Dashed line with hollow closed triangle pointing to parent/interface) */}
                  <marker
                    id="preview-realization-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <polygon
                      points="0,1.5 9,5 0,8.5"
                      fill="var(--background-paper)"
                      stroke="#10b981"
                      strokeWidth="1.8"
                    />
                  </marker>
                </defs>

                {(() => {
                  const relations = analyzeRelationships(umlClasses);
                  return relations.map((rel) => {
                    const sourcePos = classPositions[rel.source];
                    const targetPos = classPositions[rel.target];
                    if (sourcePos && targetPos) {
                      const pts = getBestConnectionPoints(
                        { title: rel.source, x: sourcePos.x, y: sourcePos.y },
                        { title: rel.target, x: targetPos.x, y: targetPos.y },
                        true,
                        relations,
                        rel
                      );
                    const pathData = getBezierPath(pts.start, pts.end);
                    
                    let strokeColor = '#8b5cf6';
                    let dashArray = 'none';
                    let markerStart = 'none';
                    let markerEnd = 'none';
                    
                    if (rel.type === 'extends') {
                      strokeColor = 'var(--primary-main)';
                      markerEnd = 'url(#preview-inheritance-arrow)';
                    } else if (rel.type === 'implements') {
                      strokeColor = '#10b981';
                      dashArray = '4 4';
                      markerEnd = 'url(#preview-realization-arrow)';
                    } else if (rel.type === 'composition') {
                      strokeColor = '#8b5cf6';
                      markerStart = 'url(#preview-composition-diamond)';
                    } else if (rel.type === 'aggregation') {
                      strokeColor = '#6366f1';
                      markerStart = 'url(#preview-aggregation-diamond)';
                    } else if (rel.type === 'association') {
                      strokeColor = '#14b8a6';
                      markerEnd = 'url(#preview-association-arrow)';
                    } else if (rel.type === 'dependency') {
                      strokeColor = '#f59e0b';
                      dashArray = '4 4';
                      markerEnd = 'url(#preview-dependency-arrow)';
                    }
                    
                    return (
                      <path
                        key={`preview-${rel.type}-line-${rel.source}-${rel.target}-${rel.fieldName || ''}`}
                        d={pathData}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                        strokeDasharray={dashArray}
                        markerStart={markerStart}
                        markerEnd={markerEnd}
                      />
                    );
                  }
                  return null;
                });
              })()}
              </svg>

              {/* Absolute Read-only Cards */}
              {umlClasses.map((umlClass, classIdx) => {
                const pos = classPositions[umlClass.title] || {
                  x: 50 + (classIdx % 3) * 420,
                  y: 50 + Math.floor(classIdx / 3) * 460
                };
                return (
                  <Box
                    key={`preview-${umlClass.title}`}
                    className="uml-preview-card"
                    data-classname={umlClass.title}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      width: `${calculateCompressedCardWidth(umlClass)}px`,
                      border: '2.5px solid var(--primary-main)',
                      borderRadius: '12px',
                      background: 'var(--background-paper)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '10px'
                    }}
                  >
                    {/* Class Title */}
                    <Box style={{ borderBottom: '1.5px solid var(--divider)', paddingBottom: '6px', marginBottom: '8px', textAlign: 'center' }}>
                      {umlClass.type === 'interface' ? (
                        <Typography variant="caption" style={{ color: '#10b981', fontWeight: 800, display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          &lt;&lt;Interface&gt;&gt;
                        </Typography>
                      ) : (
                        umlClass.abstract && (
                          <Typography variant="caption" style={{ color: 'var(--primary-main)', fontWeight: 800, display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            &lt;&lt;Abstract&gt;&gt;
                          </Typography>
                        )
                      )}
                      <Typography variant="subtitle2" style={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: 'var(--text-primary)' }}>
                        {umlClass.title}
                      </Typography>
                      {umlClass.extends && (
                        <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                          extends {umlClass.extends}
                        </Typography>
                      )}
                      {umlClass.implements && umlClass.implements.length > 0 && (
                        <Typography variant="caption" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'block' }}>
                          implements {umlClass.implements.join(', ')}
                        </Typography>
                      )}
                    </Box>

                    {/* Attributes List */}
                    {umlClass.attributes.length > 0 && (
                      <Box style={{ borderBottom: '1.5px solid var(--divider)', paddingBottom: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {umlClass.attributes.map((attr, attrIdx) => {
                          const visSign = attr.visibility === 'public' ? '+' : (attr.visibility === 'protected' ? '#' : '-');
                          return (
                            <Typography
                              key={attrIdx}
                              variant="caption"
                              style={{
                                fontFamily: 'monospace',
                                color: 'var(--text-primary)',
                                textDecoration: attr.isStatic ? 'underline' : 'none',
                                fontWeight: attr.isStatic ? 800 : 400
                              }}
                            >
                              {visSign} {attr.name}: {attr.type}
                            </Typography>
                          );
                        })}
                      </Box>
                    )}

                    {/* Methods List */}
                    {umlClass.methods.length > 0 && (
                      <Box style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {umlClass.methods.map((method, methodIdx) => {
                          const visSign = method.visibility === 'public' ? '+' : (method.visibility === 'protected' ? '#' : '-');
                          const paramsText = (method.parameters || []).map(p => `${p.name}: ${p.type}`).join(', ');
                          const retText = method.returnType === 'constructor' ? '' : `: ${method.returnType}`;
                          return (
                            <Typography
                              key={methodIdx}
                              variant="caption"
                              style={{
                                fontFamily: 'monospace',
                                color: 'var(--text-primary)',
                                textDecoration: method.isStatic ? 'underline' : 'none',
                                fontStyle: method.isAbstract ? 'italic' : 'normal',
                                fontWeight: (method.isStatic || method.isAbstract) ? 800 : 400
                              }}
                            >
                              {visSign} {method.name}({paramsText}){retText}
                            </Typography>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>

        {/* Floating zoom control bar in preview */}
        <Box
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--divider)',
            padding: '4px 12px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
            zIndex: 10
          }}
        >
          <IconButton 
            size="small" 
            disabled={previewZoomScale <= dynamicPreviewMinZoom}
            onClick={() => {
              const container = previewCanvasContainerRef.current;
              if (container) {
                const mx = container.clientWidth / 2;
                const my = container.clientHeight / 2;
                const x_virtual = (container.scrollLeft + mx) / previewZoomScale;
                const y_virtual = (container.scrollTop + my) / previewZoomScale;
                previewZoomAnchorRef.current = { x_virtual, y_virtual, mx, my };
              }
              setPreviewZoomScale(prev => Math.max(dynamicPreviewMinZoom, prev - 0.1));
            }}
            style={{ color: previewZoomScale <= dynamicPreviewMinZoom ? 'var(--text-disabled)' : 'var(--text-primary)' }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            disabled={previewZoomScale >= 2.0}
            onClick={() => {
              const container = previewCanvasContainerRef.current;
              if (container) {
                const mx = container.clientWidth / 2;
                const my = container.clientHeight / 2;
                const x_virtual = (container.scrollLeft + mx) / previewZoomScale;
                const y_virtual = (container.scrollTop + my) / previewZoomScale;
                previewZoomAnchorRef.current = { x_virtual, y_virtual, mx, my };
              }
              setPreviewZoomScale(prev => Math.min(2.0, prev + 0.1));
            }}
            style={{ color: previewZoomScale >= 2.0 ? 'var(--text-disabled)' : 'var(--text-primary)' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <Button 
            size="small" 
            onClick={() => {
              const container = previewCanvasContainerRef.current;
              if (container) {
                const mx = container.clientWidth / 2;
                const my = container.clientHeight / 2;
                const x_virtual = (container.scrollLeft + mx) / previewZoomScale;
                const y_virtual = (container.scrollTop + my) / previewZoomScale;
                previewZoomAnchorRef.current = { x_virtual, y_virtual, mx, my };
              }
              setPreviewZoomScale(1.0);
            }}
            style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'none', color: 'var(--primary-main)', minWidth: 0, padding: '2px 6px' }}
          >
            Reset
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
};
