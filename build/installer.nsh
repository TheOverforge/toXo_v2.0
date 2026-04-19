!macro customHeader
  !define MUI_LANGDLL_ALWAYSSHOW
!macroend

!macro customInit
  !insertmacro MUI_LANGDLL_DISPLAY
!macroend

!macro customInstall
  ; Write language to settings.json only on fresh install (no existing file)
  IfFileExists "$APPDATA\toxo\settings.json" skip_lang_write
    CreateDirectory "$APPDATA\toxo"
    ${If} $LANGUAGE == 1049
      FileOpen $0 "$APPDATA\toxo\settings.json" w
      FileWrite $0 '{"language":"ru"}'
      FileClose $0
    ${Else}
      FileOpen $0 "$APPDATA\toxo\settings.json" w
      FileWrite $0 '{"language":"en"}'
      FileClose $0
    ${EndIf}
  skip_lang_write:
!macroend
