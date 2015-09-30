var path = require('path');
var fs = require('fs');

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');

var code = fs.readFileSync(path.join(__dirname, 'src.js'));

var ast = esprima.parse(code, {
    sourceType: "script"
});

function transform_expr(ast, ret) {
    var res = estraverse.replace(ast, {
        enter: function (node, parent) {
            if (node.type == 'CallExpression' && node.callee.type == 'Identifier' && node.callee.name == 'bind') {
                if (node.arguments.length != 1) throw 4;
                var ident = {
                    type: 'Identifier',
                    name: '$' + (ret.cnt++)
                };
                var nextBody = {
                    "type": "BlockStatement",
                    "body": []
                };
                ret.ref.body.push({
                    "type": "ReturnStatement",
                    "argument": {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                    "type": "Identifier",
                                    "name": "$monad"
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "bind"
                                }
                            },
                            "arguments": [
                                node.arguments[0],
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [ident],
                                    "defaults": [],
                                    "body": nextBody,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        }
                    }
                });
                ret.ref = nextBody;
                return ident;
            }
        }
    });
    ret.ref.body.push(res);
}

function transform_body(ast) {
    if (ast.type != 'BlockStatement') throw 1;
    var root = {
        type: 'BlockStatement',
        body: []
    };
    var ret = {
        cnt: 1,
        ref: root
    };
    ast.body.map(function (node) {
        if (node.type == 'VariableDeclaration' || node.type == 'ExpressionStatement') {
            transform_expr(node, ret);
        } else if (node.type == 'ReturnStatement') {
            transform_expr({
                "type": "ReturnStatement",
                "argument": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "Identifier",
                            "name": "$monad"
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "wrap"
                        }
                    },
                    "arguments": [node.argument]
                }
            }, ret);
        } else {
            throw 'Cannot use there!' + node.type;
        }        
    });
    return root;
}

function transform(ast) {
    return estraverse.replace(ast, {
        enter: function (node, parent) {
            if (node.type == 'CallExpression' && node.callee.type == 'Identifier' && node.callee.name == "monad") {
                if (node.arguments.length != 1) throw 1;
                var f = node.arguments[0];
                if (f.type != 'FunctionExpression') throw 2;
                return {
                    "type": "FunctionExpression",
                    "id": f.id,
                    "params": f.params,
                    "defaults": f.defaults,
                    "body": {
                        "type": "BlockStatement",
                        "body": [
                            {
                                "type": "VariableDeclaration",
                                "declarations": [
                                    {
                                        "type": "VariableDeclarator",
                                        "id": {
                                            "type": "Identifier",
                                            "name": "$res"
                                        },
                                        "init": {
                                            "type": "FunctionExpression",
                                            "id": null,
                                            "params": [
                                                {
                                                    "type": "Identifier",
                                                    "name": "$monad"
                                                }
                                            ],
                                            "defaults": [],
                                            "body": transform_body(f.body),
                                            "generator": false,
                                            "expression": false
                                        }
                                    }
                                ],
                                "kind": "var"
                            },
                            {
                                "type": "ExpressionStatement",
                                "expression": {
                                    "type": "AssignmentExpression",
                                    "operator": "=",
                                    "left": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                            "type": "Identifier",
                                            "name": "$res"
                                        },
                                        "property": {
                                            "type": "Identifier",
                                            "name": "monadic"
                                        }
                                    },
                                    "right": {
                                        "type": "Literal",
                                        "value": true,
                                        "raw": "true"
                                    }
                                }
                            },
                            {
                                "type": "ReturnStatement",
                                "argument": {
                                    "type": "Identifier",
                                    "name": "$res"
                                }
                            }
                        ]
                    },
                    "generator": f.generator,
                    "expression": f.expression
                };
            } else {
                return node;
            }
        }
    });
}

var res = transform(ast);

var txt = escodegen.generate(res, {
    "comment": true,
    "format": {
        "indent": {
            "style": "    "
        },
        "quotes": "single"
    }
});

console.log(txt);
fs.writeFileSync(path.join(__dirname, 'dest.js'), txt);