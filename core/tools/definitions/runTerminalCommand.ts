import {
  evaluateTerminalCommandSecurity,
  ToolPolicy,
} from "@continuedev/terminal-security";
import os from "os";
import { Tool } from "../..";
import { BUILT_IN_GROUP_NAME, BuiltInToolNames } from "../builtIn";

function getPreferredShell(): string {
  const platform = os.platform();

  if (platform === "win32") {
    return "powershell.exe";
  } else if (platform === "darwin") {
    return process.env.SHELL || "/bin/zsh";
  } else {
    return process.env.SHELL || "/bin/bash";
  }
}

const platform = os.platform();

const PLATFORM_INFO = `Choose terminal commands and scripts optimized for ${platform} and ${os.arch()} and shell ${getPreferredShell()}.`;

const PLATFORM_SPECIFIC_GUIDANCE =
  platform === "win32"
    ? "On Windows, commands are executed using PowerShell. You must write PowerShell commands and avoid Linux/Unix-only commands like ls, grep, find, cat, sed, awk, tail, head, or pipelines combining them. Do not attempt to first run Linux commands and then fall back to PowerShell; always choose the correct PowerShell command directly using PowerShell cmdlets such as Get-ChildItem, Get-Content, and Select-String. When modifying file contents, avoid using -replace with complex patterns or many backslashes, because -replace interprets the first argument as a regular expression. Prefer reading the file with Get-Content -Raw into a variable and then using .Replace(oldString, newString) for literal replacements, followed by Set-Content. When reading or writing text files, default to -Encoding UTF8. If the user reports that Chinese characters appear garbled (for example, seeing '鍒涘缓' instead of '创建'), suggest re-running the command with -Encoding GB2312 or -Encoding Default as a fallback."
    : platform === "darwin" || platform === "linux"
      ? "On Unix-like systems, commands are executed using your login shell. Use standard POSIX shell commands and utilities appropriate for the detected shell."
      : "Use commands appropriate for the detected shell and platform.";

const RUN_COMMAND_NOTES = `The shell is not stateful and will not remember any previous commands.\
      When a command is run in the background ALWAYS suggest using shell commands to stop it; NEVER suggest using Ctrl+C.\
      When suggesting subsequent shell commands ALWAYS format them in shell command blocks.\
      Do NOT perform actions requiring special/admin privileges.\
      IMPORTANT: To edit files, use Edit/MultiEdit tools instead of bash commands (sed, awk, etc).\
      When writing a command, do not wrap the entire command line in extra quotes; write it exactly as you would type it in an interactive shell. For example, prefer findstr /n "pattern" "path" over "findstr /n \"pattern\" \"path\"".\
      ${PLATFORM_INFO}\
      ${PLATFORM_SPECIFIC_GUIDANCE}`;

export const runTerminalCommandTool: Tool = {
  type: "function",
  displayTitle: "Run Terminal Command",
  wouldLikeTo: "run the following terminal command:",
  isCurrently: "running the following terminal command:",
  hasAlready: "ran the following terminal command:",
  readonly: false,
  group: BUILT_IN_GROUP_NAME,
  function: {
    name: BuiltInToolNames.RunTerminalCommand,
    description: `Run a terminal command in the current directory.\n${RUN_COMMAND_NOTES}`,
    parameters: {
      type: "object",
      required: ["command"],
      properties: {
        command: {
          type: "string",
          description:
            "The command to run. This will be passed directly into the IDE shell.",
        },
        waitForCompletion: {
          type: "boolean",
          description:
            "Whether to wait for the command to complete before returning. Default is true. Set to false to run the command in the background. Set to true to run the command in the foreground and wait to collect the output.",
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithPermission",
  evaluateToolCallPolicy: (
    basePolicy: ToolPolicy,
    parsedArgs: Record<string, unknown>,
  ): ToolPolicy => {
    return evaluateTerminalCommandSecurity(
      basePolicy,
      parsedArgs.command as string,
    );
  },
  systemMessageDescription: {
    prefix: `To run a terminal command, use the ${BuiltInToolNames.RunTerminalCommand} tool
${RUN_COMMAND_NOTES}
You can also optionally include the waitForCompletion argument set to false to run the command in the background.      
For example, to see the git log, you could respond with:`,
    exampleArgs: [["command", "git log"]],
  },
};
