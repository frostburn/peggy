"use strict";

const chai = require("chai");
const parser = require("../../lib/parser");
const compiler = require("../../lib/compiler/index");

const expect = chai.expect;

describe("Peggy compiler", () => {
  it("checks start rules", () => {
    const ast = parser.parse("foo='1'");
    expect(compiler.compile(ast, compiler.passes)).to.be.an("object");
    expect(compiler.compile(ast, compiler.passes, {
      allowedStartRules: null,
    })).to.be.an("object");
    expect(compiler.compile(ast, compiler.passes, {
      allowedStartRules: undefined,
    })).to.be.an("object");
    expect(compiler.compile(ast, compiler.passes, {
      allowedStartRules: [],
    })).to.be.an("object");
    expect(() => compiler.compile(ast, compiler.passes, {
      allowedStartRules: {},
    })).to.throw("allowedStartRules must be an array");
    expect(() => compiler.compile(ast, compiler.passes, {
      allowedStartRules: ["bar"],
    })).to.throw('Unknown start rule "bar"');
  });

  it("checks output type", () => {
    const ast = parser.parse("foo='1'");
    expect(compiler.compile(ast, compiler.passes, {
      output: "source",
    })).to.be.a("string");
    expect(() => compiler.compile(ast, compiler.passes, {
      output: "INVALID OUTPUT TYPE",
    })).to.throw("Invalid output format: INVALID OUTPUT TYPE.");
  });

  it("generates inline sourceMappingURL", () => {
    const ast = parser.parse("foo='1'");
    expect(ast).to.be.an("object");

    // Don't run on old IE
    if (typeof TextEncoder === "function") {
      expect(compiler.compile(ast, compiler.passes, {
        output: "source-with-inline-map",
        grammarSource: "src.peggy",
      })).to.match(
        /^\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,/m
      );
      // I *think* everywhere that has TextEncoder also has globalThis, but
      // I'm not positive.
      if (typeof globalThis === "object") {
        const TE = globalThis.TextEncoder;
        delete globalThis.TextEncoder;
        expect(() => compiler.compile(ast, compiler.passes, {
          output: "source-with-inline-map",
          grammarSource: "src.peggy",
        })).to.throw("TextEncoder is not supported by this platform");
        globalThis.TextEncoder = TE;
      }
    }
  });

  it("requires grammarSource with source-map", () => {
    const ast = parser.parse("foo='1'");
    expect(ast).to.be.an("object");
    expect(() => compiler.compile(ast, compiler.passes, {
      output: "source-and-map",
    })).to.throw("Must provide grammarSource (as a string or GrammarLocation) in order to generate source maps");
    expect(() => compiler.compile(ast, compiler.passes, {
      output: "source-and-map",
      grammarSource: "",
    })).to.throw("Must provide grammarSource (as a string or GrammarLocation) in order to generate source maps");
    // Don't run on old IE
    if (typeof TextEncoder === "function") {
      expect(() => compiler.compile(ast, compiler.passes, {
        output: "source-with-inline-map",
        grammarSource: { toString() { return ""; } },
      })).to.throw("Must provide grammarSource (as a string or GrammarLocation) in order to generate source maps");
    }
  });
});
