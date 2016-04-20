[![NPM](https://nodei.co/npm/acorn-es7-plugin.png?downloads=true&downloadRank=true)](https://nodei.co/npm/acorn-es7-plugin/)

acorn-es7-plugin
======

acorn-es7-plugin is a plugin for the [Acorn](https://github.com/marijnh/acorn) parser that generates ESTrees following the ['experimental' specification](https://github.com/estree/estree/blob/master/experimental/async-functions.md) for asynchronous functions.

	npm install --save acorn-es7-plugin

Usage
=====

Adding the plugin

	// Require acorn as usual
	var acorn = require("acorn");
	// Add the es7-plugin
	require('./acorn-es7-plugin')(acorn) ;

Using the plugin

	var code = "async function x(){ if (x) return await(x-1) ; return 0 ; }\n";
	var ast = acorn.parse(code,{
		// Specify use of the plugin
		plugins:{asyncawait:true},
		// Specify the ecmaVersion
		ecmaVersion:7
	}) ;
	// Show the AST
	console.log(JSON.stringify(ast,null,2)) ;

Output:

	{
		"type": "Program",
		"body": [
		{
		  "type": "FunctionDeclaration",
		  "id": {
		    "type": "Identifier",
		    "name": "x"
		  },
		  "generator": false,
		  "expression": false,
		  "params": [],
		  "body": {
		    "type": "BlockStatement",
		    "body": [
		      {
		        "type": "IfStatement",
		        "test": {
		          "type": "Identifier",
		          "name": "x"
		        },
		        "consequent": {
		          "type": "ReturnStatement",
		          "argument": {
		            "type": "AwaitExpression",
		            "operator": "await",
		            "argument": {
		              "type": "BinaryExpression",
		              "left": {
		                "type": "Identifier",
		                "name": "x"
		              },
		              "operator": "-",
		              "right": {
		                "type": "Literal",
		                "value": 1,
		                "raw": "1"
		              }
		            }
		          }
		        },
		        "alternate": null
		      },
		      {
		        "type": "ReturnStatement",
		        "argument": {
		          "type": "Literal",
		          "value": 0,
		          "raw": "0"
		        }
		      }
		    ]
		  },
		  "async": true
		}
		],
		"sourceType": "script"
	}

Options & Compliance
====================
The parser attempts to enforce strict contextualisation of `async` and `await`. Specifically, `async` is only a keyword if it precedes a function declaration, function expression or arrow function. `await` is only a keyword inside an `async` function. Outside of these contexts, both tokens are treated as identifiers (as they were in ES6 and earlier).

When using the plugin, you can supply an object in place of the 'true' flag with the following options.

| flag | meaning |
|------|---------|
| awaitAnywhere | If `await` is used outside of an async function and could not be an identifier, generate an AwaitExpression node. This typically means you can use `await` anywhere _except_ when its argument would require parentheses, as this parses to a call to 'await(....)'. |
| asyncExits | Allow the additional sequences `async return <optional-expression>` and `async throw <expression>`. These sequences are used with [nodent](https://github.com/MatAtBread/nodent). In each case, as with async functions, a standard ReturnStatement (or ThrowStatement) node is generated, with an additional member 'async' set to true.

Changelog
=========

26-Feb-16: v1.0.12

- Updated to return the original acorn object on installation. See https://github.com/MatAtBread/acorn-es7-plugin/pull/4

19-Dec-15: v1.0.11

- Generate error if 'await' is used as an identifier within an async function.

10-Dec-15: v1.0.10

- Update the plugin code to remove 'async' and 'await' from the super-strict keyword tests introduced in acorn v2.6.x that generate parse errors before the plugin gets a chance to manage them.
