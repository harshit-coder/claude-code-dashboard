' =============================================================================
' Claude Code Dashboard — Windows Auto-Start Script
' =============================================================================
'
' PURPOSE:
'   Silently launches the Claude Code Dashboard server on Windows login.
'   No command window is shown — it runs completely in the background.
'
' INSTALLATION:
'   1. Press Win+R, type: shell:startup, press Enter
'   2. Copy this file (autostart.vbs) into the Startup folder
'   3. Edit the path below to match where you installed the dashboard
'   4. Restart your PC or double-click the file to start immediately
'
' TO STOP:
'   Open Task Manager > find "node.exe" > End Task
'
' TO REMOVE AUTO-START:
'   Delete this file from the Startup folder
'
' =============================================================================

Dim installPath

' ===== EDIT THIS PATH to match your installation =====
installPath = "C:\Users\" & CreateObject("WScript.Network").UserName & "\claude-code-dashboard"
' =====================================================

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = installPath
WshShell.Run "node mcp-manager-server.js", 0, False
