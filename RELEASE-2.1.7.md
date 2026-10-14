# JIGGY 2.1.7

Im Cloud-Kontobereich gibt es jetzt „Passwort vergessen“. Der Dialog fordert eine E-Mail mit einem Link zum Zurücksetzen des JIGGY-Kontopassworts an. Das Zurücksetzen erfolgt über die JIGGY-Webseite; lokale Fahrzeugdaten bleiben erhalten.

Der Quellcode ist mit dem tatsächlich ausgelieferten Desktop-Stand 2.1.6 abgeglichen, damit dessen vorhandene Funktionen auch im Update enthalten sind. Die gemeinsame Account-API und Mobile 0.1.16 unterstützen den neuen Ablauf bereits.

## Prüfung

- Desktop-Dialog mit der isolierten Account-API geprüft, einschließlich Fehlerbehandlung.
- Registrierung, ablaufende und einmalige Reset-Links, alte Sitzungen sowie Versandfehler und erneute Zustellung geprüft.
- Windows-Installer gebaut und enthaltene Version sowie Recovery-Skript kontrolliert.
- Installer, Blockmap und latest.yml werden gemeinsam veröffentlicht. Die Prüfsumme und Dateigröße in latest.yml müssen zum Installer passen.

Der Versand einer Reset-Mail allein ändert das Passwort nicht. Nach einem erfolgreichen Reset muss sich der Nutzer erneut bei der Cloud anmelden.
