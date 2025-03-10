import React from "react";
import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import * as monaco from 'monaco-editor';
// import { tableSchema } from "./tableSchema1";
// import * as B from "@mobily/ts-belt";

// const schemaTableNames = B.pipe(
//     tableSchema,
//     B.A.map((d) => d.table_name),
//     B.A.uniq
// );

// const schemaTableNamesSet = new Set(schemaTableNames);

function parseSqlAndFindTableNameAndAliases(sql: string) {
    const regex = /\b(?:FROM|JOIN)\s+([^\s.]+(?:\.[^\s.]+)?)\s*(?:AS)?\s*([^\s,]+)?/gi;
    const tables = [];

    while (true) {
        const match = regex.exec(sql);
        if (!match) {
            break;
        }
        const table_name = match[1];
        if (!/\(/.test(table_name)) {
            // exclude function calls
            let alias = match[2] as string | null;
            if (alias && /on|where|inner|left|right|join/.test(alias)) {
                alias = null;
            }
            tables.push({
                table_name,
                alias: alias || table_name
            });
        }
    }

    return tables;
}

interface MonacoEditorProps {
    code: string;
    // onChange: OnChange;
}

class MonacoEditor extends React.Component<MonacoEditorProps> {
    // private editor?: monaco.editor.IStandaloneCodeEditor;


    handleEditorDidMount: OnMount = (editor, monaco) => {
        // this.editor = editor;
        editor.focus();

        monaco.languages.registerCompletionItemProvider("*", {
            provideCompletionItems: (model, position, context, cancelationToken,) => {
                // const monaco = useMonaco();
                var word = model.getWordUntilPosition(position);
                var range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,// - 1, // UNCOMMENT THIS AND IT BREAKS
                    endColumn: word.endColumn
                };

                let suggestions: monaco.languages.CompletionItem[] = [
                    {
                        label: "myCustomSnippet",
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: "This is a piece of custom code",
                        insertTextRules:
                            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: "This is a piece of custom code",
                        range: range,
                    }
                ];

                const fullQueryText = model.getValue();

                const tableNamesAndAliases = new Map(
                    parseSqlAndFindTableNameAndAliases(
                        fullQueryText
                    ).map(({ table_name, alias }) => [alias, table_name])
                );

                const thisLine = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                const thisToken = thisLine.trim().split(" ").slice(-1)?.[0] || "";

                const lastTokenBeforeSpace = /\s?(\w+)\s+\w+$/.exec(
                    thisLine.trim()
                )?.[1];
                const lastTokenBeforeDot = /(\w+)\.\w*$/.exec(thisToken)?.[1];

                console.log(
                    tableNamesAndAliases,
                    thisToken,
                    lastTokenBeforeSpace,
                    lastTokenBeforeDot
                );

                // if (
                //     lastTokenBeforeSpace &&
                //     /from|join|update|into/.test(lastTokenBeforeSpace)
                // ) {
                //     suggestions.push(
                //         ...schemaTableNames.map((table_name) => ({
                //             label: table_name,
                //             kind: monaco.languages.CompletionItemKind.Field,
                //             insertText: table_name
                //         }))
                //     );
                // }

                if (lastTokenBeforeDot) {
                    let table_name = null as string | null;
                    // if (schemaTableNamesSet.has(lastTokenBeforeDot)) {
                    //     table_name = lastTokenBeforeDot;
                    // } else 
                    if (tableNamesAndAliases.get(lastTokenBeforeDot)) {
                        table_name = tableNamesAndAliases.get(lastTokenBeforeDot) as string;
                    }
                    // if (table_name) {
                    //     suggestions.push(
                    //         ...tableSchema
                    //             .filter((d) => d.table_name === table_name)
                    //             .map(({ table_name, column_name }) => ({
                    //                 label: column_name,
                    //                 kind: monaco.languages.CompletionItemKind.Field,
                    //                 insertText: column_name
                    //             }))
                    //     );
                    // }
                }

                return {
                    // suggestions: B.pipe(
                    suggestions
                    // B.A.uniqBy((s) => s.insertText)
                    // )
                };
            }
        });
    };

    render() {
        return (
            <Editor
                height="90vh"
                theme="vs-dark"
                defaultLanguage="sql"
                defaultValue={this.props.code}
                // onChange={this.props.onChange}
                onMount={this.handleEditorDidMount}
            />
        );
    }
}

export default MonacoEditor;
