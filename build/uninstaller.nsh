; Claude Code Dashboard — Custom Uninstaller Script
; Cleans up auto-start registry entry and app data on uninstall

!macro customUnInstall
  ; Remove auto-start login item from registry (current user)
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Claude Code Dashboard"

  ; Ask user if they want to remove app configuration data
  MessageBox MB_YESNO "Do you want to remove your Claude Code Dashboard settings and cache?$\n$\n(This will NOT remove your Claude Code configuration in ~/.claude)" IDYES removeData IDNO skipData

  removeData:
    ; Remove app-specific Electron data
    RMDir /r "$APPDATA\claude-code-dashboard"
    RMDir /r "$LOCALAPPDATA\claude-code-dashboard"
    Goto done

  skipData:
  done:
!macroend
