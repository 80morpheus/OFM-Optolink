// OFM-IO-Homecontrol -- OpenKNX --
// ETS JavaScript for io-homecontrol pairing workflow
// Uses function properties (objectIndex=160, propertyId=10) for device communication

var OPTO_FUNCTION_PROPERTY_OBJECT_INDEX = 160;
var OPTO_FUNCTION_PROPERTY_ID = 10;

function OPTO_invokeFunctionProperty(online, data) {
    return online.invokeFunctionProperty(OPTO_FUNCTION_PROPERTY_OBJECT_INDEX, OPTO_FUNCTION_PROPERTY_ID, data);
}

function OPTO_getChannelPrefix(context) {
    return "OPTO_c" + context.channelIndex;
}

function OPTO_getGlobalPrefix() {
    return "OPTO_";
}

function OPTO_getParameter(device, name) {
    return device.getParameterByName(name);
}

function OPTO_setParameterValue(device, name, value) {
    var parameter = OPTO_getParameter(device, name);
    if (parameter) {
        if (typeof value === "string" && value.length > 40) {
            value = value.substring(0, 40);
        }
        parameter.value = value;
    }
}

function OPTO_pad2(value) {
    return value < 10 ? "0" + value : "" + value;
}

function OPTO_nowText() {
    var now = new Date();
    return now.getFullYear() + "-" +
           OPTO_pad2(now.getMonth() + 1) + "-" +
           OPTO_pad2(now.getDate()) + " " +
           OPTO_pad2(now.getHours()) + ":" +
           OPTO_pad2(now.getMinutes()) + ":" +
           OPTO_pad2(now.getSeconds());
}

function OPTO_formatNodeId(nodeId) {
    if (!nodeId) {
        return "nicht angelernt";
    }

    var text = nodeId.toString(16).toUpperCase();
    while (text.length < 6) {
        text = "0" + text;
    }
    return text;
}

function OPTO_readNodeId(resp, startIndex) {
    return ((resp[startIndex] || 0) << 16) |
           ((resp[startIndex + 1] || 0) << 8) |
           (resp[startIndex + 2] || 0);
}

function OPTO_appendNodeId(data, nodeId) {
    var normalizedNodeId = nodeId || 0;
    data.push((normalizedNodeId >> 16) & 0xFF);
    data.push((normalizedNodeId >> 8) & 0xFF);
    data.push(normalizedNodeId & 0xFF);
}

function OPTO_etsDeviceType(protocolType) {
    switch (protocolType) {
    case 0x01: // Venetian blind
    case 0x02: // Roller shutter
    case 0x0A: // Blind
    case 0x0D: // Dual shutter
    case 0x11: // External Venetian blind
    case 0x12: // Louvre blind
    case 0x18: // Swinging shutter
        return 1;
    case 0x04:
        return 2;
    case 0x03:
        return 3;
    case 0x05:
    case 0x08:
        return 4;
    case 0x0E:
    case 0x15:
    case 0x16:
        return 5;
    case 0x06:
        return 6;
    case 0x07:
        return 7;
    case 0x09:
        return 8;
    case 0x10:
        return 9;
    case 0x13:
        return 10;
    case 0x14:
        return 11;
    case 0x0F:
        return 12;
    default:
        return 0;
    }
}

function OPTO_importDeviceLabel(etsType) {
    switch (etsType) {
    case 1: return "Rollladen/Jalousie";
    case 2: return "Fenster";
    case 3: return "Markise";
    case 4: return "Garagentor";
    case 5: return "Thermostat";
    case 6: return "Licht";
    case 7: return "Tor";
    case 8: return "Schloss";
    case 9: return "Sonnenschutz";
    case 10: return "Vorhangschiene";
    case 11: return "Lüftung";
    case 12: return "Schalter";
    default: return "ioHC-Gerät";
    }
}

function OPTO_setExtractionResult(device, statusText, nodeIds) {
    OPTO_setParameterValue(device, "OPTO_ExtractionLastResult", statusText);
    for (var part = 0; part < 4; part++) {
        var first = part * 5;
        var values = [];
        for (var i = first; i < nodeIds.length && i < first + 5; i++) {
            values.push(OPTO_formatNodeId(nodeIds[i]));
        }
        OPTO_setParameterValue(device, "OPTO_ExtractionNodeIds" + (part + 1),
                               values.length ? values.join(", ") : "-");
    }
}

function OPTO_configureImportedChannel(device, channelNumber, discovery) {
    var prefix = "OPTO_c" + channelNumber;
    var etsType = OPTO_etsDeviceType(discovery.protocolType);
    OPTO_setParameterValue(device, prefix + "Name",
                           OPTO_importDeviceLabel(etsType) + " " + OPTO_formatNodeId(discovery.nodeId));
    OPTO_setParameterValue(device, prefix + "ProtocolMode", 0);
    OPTO_setParameterValue(device, prefix + "DeviceType", etsType);
    OPTO_setParameterValue(device, prefix + "TwoWayPowerClass", discovery.powerClass);
    OPTO_setParameterValue(device, prefix + "Suspend", 0);
    OPTO_setParameterValue(device, prefix + "PairingLastResult", "Automatisch importiert");
    OPTO_setParameterValue(device, prefix + "PairedNodeIdDisplay", OPTO_formatNodeId(discovery.nodeId));
    OPTO_setParameterValue(device, prefix + "OneWaySummary", "2W (bidirektional)");
    OPTO_setParameterValue(device, prefix + "PairingDiag", "Programmierung erforderlich");
    // Activate last so all settings are coherent before the calculated
    // channel selector refreshes the dynamic view.
    OPTO_setParameterValue(device, prefix + "Active", 1);
}

function OPTO_syncChannelSelection(input, output, context) {
    if (input.Selection !== undefined) {
        var selection = Number(input.Selection);
        output.Active = selection > 0 ? 1 : 0;
        if (selection > 0) {
            output.DeviceType = selection - 1;
        }
        return;
    }

    output.Selection = Number(input.Active) == 1
        ? Number(input.DeviceType) + 1
        : 0;
}

function OPTO_controllerStateText(state) {
    switch (state) {
    case 0:
        return "Idle";
    case 6:
        return "Discovery senden";
    case 7:
        return "Warte Discovery";
    case 8:
        return "Discovery bestaetigen";
    case 9:
        return "Warte Discovery-Ack";
    case 10:
        return "Pause vor Key-Init";
    case 11:
        return "Starte Key-Transfer";
    case 12:
        return "Warte Key-Transfer";
    case 13:
        return "1W Challenge senden";
    case 14:
        return "Warte 1W Challenge";
    case 15:
        return "1W Ankuendigung senden";
    case 16:
        return "Warte 1W Ankuendigung";
    case 17:
        return "1W Remove senden";
    case 18:
        return "Warte 1W Remove";
    case 19:
        return "1W Key senden";
    case 20:
        return "Warte 1W Key";
    case 21:
        return "1W STOP senden";
    case 22:
        return "Warte 1W STOP";
    case 23:
        return "1W Abschluss-Pause";
    case 24:
        return "1W AB senden";
    case 25:
        return "Warte 1W AB";
    case 26:
        return "Key init senden";
    case 27:
        return "Warte Challenge";
    case 28:
        return "Key senden";
    case 29:
        return "Key-Antwort senden";
    case 30:
        return "Warte Key-Bestaetigung";
    case 31:
        return "SetConfig1 senden";
    case 32:
        return "Warte SetConfig1";
    case 33:
        return "SetConfig1 Auth senden";
    case 34:
        return "Warte SetConfig1 final";
    case 35:
        return "Pairing abgeschlossen";
    case 36:
        return "Pairing fehlgeschlagen";
    default:
        return "State " + state;
    }
}

function OPTO_setPairingInfo(device, context, resultText, nodeText, oneWaySummary, diagText) {
    var prefix = OPTO_getChannelPrefix(context);
    OPTO_setParameterValue(device, prefix + "PairingLastResult", resultText);
    OPTO_setParameterValue(device, prefix + "PairedNodeIdDisplay", nodeText);
    OPTO_setParameterValue(device, prefix + "OneWaySummary", oneWaySummary);
    OPTO_setParameterValue(device, prefix + "PairingDiag", diagText);
}

function OPTO_buildOneWaySummary(device, context, paired, pairedNodeId) {
    var prefix = OPTO_getChannelPrefix(context);
    var protocolMode = OPTO_getParameter(device, prefix + "ProtocolMode").value;
    if (protocolMode != 1) {
        return "2W (bidirektional)";
    }

    var broadcastType = OPTO_getParameter(device, prefix + "OneWayBroadcastType").value;
    var typeText = broadcastType;
    if (broadcastType == 255) {
        var deviceType = OPTO_getParameter(device, prefix + "DeviceType").value;
        typeText = "auto->" + ((deviceType == 3 || deviceType == 9) ? "3" : "2");
    }
    var targetNodeId = OPTO_getParameter(device, prefix + "OneWayTargetNodeId").value;
    if (!targetNodeId) {
        if (!paired) {
            return "1W Typ " + typeText + ", Rundruf, nicht angelernt";
        }
        return pairedNodeId
            ? "1W Typ " + typeText + ", gepaart " + OPTO_formatNodeId(pairedNodeId)
            : "1W Typ " + typeText + ", angelernt (Rundruf)";
    }

    var targetText = OPTO_formatNodeId(targetNodeId);
    if (!paired) {
        return "1W Typ " + typeText + ", Ziel " + targetText + ", nicht angelernt";
    }

    if (!pairedNodeId) {
        return "1W Typ " + typeText + ", Ziel " + targetText + ", angelernt";
    }

    var pairedText = OPTO_formatNodeId(pairedNodeId);
    if (pairedNodeId === targetNodeId) {
        return "1W Typ " + typeText + ", Ziel " + targetText + " aktiv";
    }

    return "1W Typ " + typeText + ", Ziel " + targetText + ", gepaart " + pairedText;
}

function OPTO_applyStatusResponse(device, context, resp, fallbackResult, fallbackDiag) {
    var paired = (resp[0] || 0) !== 0;
    var pairedNodeId = OPTO_readNodeId(resp, 1);
    var controllerState = resp.length > 4 ? resp[4] : 0;
    var lastStartStatus = resp.length > 5 ? resp[5] : 0;
    var statusPrefix = OPTO_getChannelPrefix(context);
    var isOneWay = OPTO_getParameter(device, statusPrefix + "ProtocolMode").value == 1;
    // 1W has no peer node id: the channel reports its controller enrollment
    // state instead of a paired actuator address.
    var nodeText = isOneWay
        ? (paired ? "1W angelernt (ohne Node-ID)" : "nicht angelernt")
        : (paired ? OPTO_formatNodeId(pairedNodeId) : "nicht angelernt");
    var resultText = fallbackResult;
    var diagText = fallbackDiag;

    if (!resultText) {
        if (paired) {
            resultText = isOneWay ? "1W Anmeldung gesendet" : "Angelernt";
        } else if (controllerState >= 6 && controllerState <= 28) {
            resultText = "Pairing aktiv";
        } else {
            resultText = "Nicht angelernt";
        }
    }

    if (!diagText) {
        if (controllerState >= 6 && controllerState <= 28) {
            diagText = OPTO_controllerStateText(controllerState);
        } else if (lastStartStatus == 1) {
            diagText = "Controller war blockiert";
        } else if (paired) {
            diagText = isOneWay
                ? "1W Anmeldesequenz gesendet; Annahme durch den Aktor nicht rückmeldbar"
                : "Gerät ist angelernt";
        } else {
            diagText = "Kein aktiver Pairing-Vorgang";
        }
    }

    var oneWaySummary = OPTO_buildOneWaySummary(device, context, paired, pairedNodeId);
    var prefix = OPTO_getChannelPrefix(context);
    var protocolMode = OPTO_getParameter(device, prefix + "ProtocolMode").value;
    if (protocolMode == 1 && resp.length >= 13) {
        var broadcastType = resp.length >= 14 ? resp[13] : OPTO_getParameter(device, prefix + "OneWayBroadcastType").value;
        var profileChannel = resp[6] || 0;
        var profileNodeId = OPTO_readNodeId(resp, 7);
        var manufacturer = resp[10] || 0;
        var sequence = ((resp[11] || 0) << 8) | (resp[12] || 0);
        oneWaySummary = "1W T" + broadcastType + " P" + profileChannel + " " +
                        OPTO_formatNodeId(profileNodeId) + " M" + manufacturer + " S" + sequence;
    }

    OPTO_setPairingInfo(device, context, resultText, nodeText, oneWaySummary, diagText);
}

function OPTO_queryPairingInfo(device, online, progress, context, fallbackResult, fallbackDiag) {
    var channelIndex = context.channelIndex - 1;
    var data = [0x12];
    data = data.concat(channelIndex);

    // Distinguish two very different failure modes:
    //  - invokeFunctionProperty THROWS  -> the device answered the connection
    //    but the property read itself failed (bus error, timeout, busy). The
    //    application is present, so this is a genuine read failure.
    //  - it returns empty / too short    -> the io-homecontrol function property
    //    does not exist, i.e. only the .knxprod was loaded and the application
    //    was never downloaded to the device ("not programmed").
    var resp = null;
    var readError = null;
    try {
        resp = OPTO_invokeFunctionProperty(online, data);
    } catch (error) {
        readError = error;
    }

    if (readError) {
        // Do not abort the whole script (red "failed" in ETS); report per channel.
        OPTO_setPairingInfo(
            device,
            context,
            "Lesen fehlgeschlagen",
            "unbekannt",
            OPTO_buildOneWaySummary(device, context, false, 0),
            "Statusabfrage fehlgeschlagen");
        if (progress) {
            progress.setProgress(100);
        }
        return null;
    }

    if (!resp || resp.length < 4) {
        OPTO_setPairingInfo(
            device,
            context,
            "Nicht programmiert",
            "unbekannt",
            OPTO_buildOneWaySummary(device, context, false, 0),
            "Applikation nicht programmiert?");
        if (progress) {
            progress.setProgress(100);
        }
        return null;
    }

    OPTO_applyStatusResponse(device, context, resp, fallbackResult, fallbackDiag);
    if (progress) {
        progress.setProgress(100);
    }
    return resp;
}

function OPTO_refreshAllPairingInfo(device, online, progress, context) {
    var channelCount = context.channelCount;
    if (!channelCount || channelCount < 1) {
        throw new Error("io-homecontrol: Keine Kanäle für die Pairing-Übersicht konfiguriert");
    }

    var activeChannels = [];
    for (var channelIndex = 1; channelIndex <= channelCount; channelIndex++) {
        var activity = OPTO_getParameter(device, "OPTO_c" + channelIndex + "Active");
        if (activity && activity.value == 1) {
            activeChannels.push(channelIndex);
        }
    }

    if (activeChannels.length == 0) {
        OPTO_setParameterValue(device, OPTO_getGlobalPrefix() + "OverviewLastRefresh", OPTO_nowText());
        progress.setText("Pairing-Übersicht: Keine aktivierten Kanäle.");
        progress.setProgress(100);
        return;
    }

    progress.setText("Pairing-Übersicht wird für " + activeChannels.length + " aktivierte Kanäle aktualisiert ...");
    progress.setProgress(5);
    // Read each channel in its own connect/disconnect cycle, exactly like the
    // per-channel "Pairing-Status auslesen" button. Holding a single connection
    // open across all reads does not work reliably; only the first read succeeds.
    for (var activeIndex = 0; activeIndex < activeChannels.length; activeIndex++) {
        var channelIndex = activeChannels[activeIndex];
        online.connect();
        try {
            OPTO_queryPairingInfo(device, online, null, { channelIndex: channelIndex }, "Status gelesen", "Status über Übersicht gelesen");
        } finally {
            online.disconnect();
        }
        progress.setText("Pairing-Übersicht: Kanal " + channelIndex + " aktualisiert (" + (activeIndex + 1) + " von " + activeChannels.length + ") ...");
        progress.setProgress(Math.floor(((activeIndex + 1) * 100) / activeChannels.length));
    }
    OPTO_setParameterValue(device, OPTO_getGlobalPrefix() + "OverviewLastRefresh", OPTO_nowText());

    progress.setText("Pairing-Übersicht aktualisiert.");
    progress.setProgress(100);
}

/**
 * Start pairing on the current channel.
 * Called from ETS Button with EventHandlerOnline="ConnectionOriented".
 *
 * @param {Object} device - ETS device object (parameter access)
 * @param {Object} online - Online connection to the device
 * @param {Object} progress - Progress bar control
 * @param {Object} context - Context with parameter references
 */
function OPTO_startPairing(device, online, progress, context) {
    var channelIndex = context.channelIndex - 1;
    var prefix = OPTO_getChannelPrefix(context);
    progress.setText("Pairing wird gestartet für Kanal " + (channelIndex + 1) + " ...");
    progress.setProgress(10);
    online.connect();
    try {
        var data = [0x10];
        data = data.concat(channelIndex);
        if (OPTO_getParameter(device, prefix + "ProtocolMode").value == 1) {
            OPTO_appendNodeId(data, OPTO_getParameter(device, prefix + "OneWayTargetNodeId").value);
        }
        var resp = OPTO_invokeFunctionProperty(online, data);

        if (resp[0] == 0) {
            progress.setText("Pairing gestartet. Gerät jetzt in den Lernmodus versetzen und Konsole oder Pairing-Status beobachten.");
            OPTO_queryPairingInfo(device, online, progress, context, "Pairing gestartet", "ETS hat den Start ausgelöst");
            return;
        }

        if (resp[0] == 4) {
            OPTO_setPairingInfo(device, context, "Start blockiert", "nicht angelernt", OPTO_buildOneWaySummary(device, context, false, 0), "Controller ist gerade beschaeftigt");
            throw new Error("io-homecontrol: Pairing ist gerade durch einen anderen Controller-Vorgang blockiert");
        }

        OPTO_setPairingInfo(device, context, "Start fehlgeschlagen", "nicht angelernt", OPTO_buildOneWaySummary(device, context, false, 0), "Unbekannter Startfehler");
        throw new Error("io-homecontrol: Pairing konnte nicht gestartet werden");
    } finally {
        online.disconnect();
    }
}

/**
 * Remove pairing (unpair) for the current channel.
 * Called from ETS Button with EventHandlerOnline="ConnectionOriented".
 *
 * @param {Object} device - ETS device object
 * @param {Object} online - Online connection to the device
 * @param {Object} progress - Progress bar control
 * @param {Object} context - Context with parameter references
 */
function OPTO_unpair(device, online, progress, context) {
    var channelIndex = context.channelIndex - 1;
    progress.setText("Pairing wird entfernt für Kanal " + (channelIndex + 1) + " ...");
    progress.setProgress(30);
    online.connect();
    try {
        var data = [0x13];
        data = data.concat(channelIndex);
        var resp = OPTO_invokeFunctionProperty(online, data);

        if (resp[0] == 0) {
            progress.setText("Pairing entfernt für Kanal " + (channelIndex + 1) + ".");
            OPTO_queryPairingInfo(device, online, progress, context, "Pairing entfernt", "Pairing und Schluessel geloescht");
            return;
        }

        OPTO_setPairingInfo(device, context, "Entfernen fehlgeschlagen", "unbekannt", OPTO_buildOneWaySummary(device, context, false, 0), "Unpair hat keinen Erfolg gemeldet");
        throw new Error("io-homecontrol: Entfernen des Pairings fehlgeschlagen");
    } finally {
        online.disconnect();
    }
}

function OPTO_refreshPairingInfo(device, online, progress, context) {
    var channelIndex = context.channelIndex - 1;
    progress.setText("Pairing-Status wird gelesen für Kanal " + (channelIndex + 1) + " ...");
    progress.setProgress(25);
    online.connect();
    try {
        OPTO_queryPairingInfo(device, online, progress, context, "Status gelesen", "Status direkt vom Gerät gelesen");
    } finally {
        online.disconnect();
    }
    progress.setText("Pairing-Status aktualisiert für Kanal " + (channelIndex + 1) + ".");
}

function OPTO_generateOneWayProfile(device, online, progress, context) {
    var channelIndex = context.channelIndex - 1;
    progress.setText("Neues eigenes 1W-Controllerprofil wird erzeugt für Kanal " + (channelIndex + 1) + " ...");
    progress.setProgress(20);
    online.connect();
    try {
        var resp = OPTO_invokeFunctionProperty(online, [0x15, channelIndex]);
        if (!resp || resp.length < 1) {
            throw new Error("io-homecontrol: Keine Antwort beim Erzeugen des 1W-Profils");
        }
        if (resp[0] == 0) {
            OPTO_queryPairingInfo(device, online, progress, context, "Neues 1W-Profil erzeugt", "Eigenes 1W-Profil bereit");
            progress.setText("Neues eigenes 1W-Controllerprofil für Kanal " + (channelIndex + 1) + " erzeugt.");
            return;
        }
        if (resp[0] == 3) {
            throw new Error("io-homecontrol: Profil wird von mindestens einem gepaarten Kanal verwendet. Pairing zuerst entfernen.");
        }
        if (resp[0] == 4) {
            throw new Error("io-homecontrol: Kanal verwendet ein geteiltes Profil. In ETS zuerst 'eigenes Profil' wählen.");
        }
        throw new Error("io-homecontrol: Neues 1W-Profil konnte nicht erzeugt werden");
    } finally {
        online.disconnect();
    }
}

function OPTO_startOneWayClone(device, online, progress, context) {
    var channelIndex = context.channelIndex - 1;
    progress.setText("1W-Klonen wird vorbereitet für Kanal " + (channelIndex + 1) + " ...");
    progress.setProgress(20);
    online.connect();
    try {
        var resp = OPTO_invokeFunctionProperty(online, [0x16, channelIndex]);
        if (!resp || resp.length < 1) {
            throw new Error("io-homecontrol: Keine Antwort beim Start des 1W-Klonens");
        }
        if (resp[0] == 0) {
            OPTO_setPairingInfo(device, context, "1W-Klon aktiv", "nicht angelernt", OPTO_buildOneWaySummary(device, context, false, 0), "Originalfernbedienung jetzt kopieren");
            progress.setText("1W-Klonen aktiv. Jetzt an der Original-Fernbedienung die Copy-Funktion auslösen.");
            progress.setProgress(100);
            return;
        }
        if (resp[0] == 4) {
            throw new Error("io-homecontrol: 1W-Klonen ist gerade durch einen anderen Controller-Vorgang blockiert");
        }
        throw new Error("io-homecontrol: Kanal ist nicht für 1W-Klonen geeignet");
    } finally {
        online.disconnect();
    }
}

function OPTO_startKeyExtract(device, online, progress, context) {
    progress.setText("2W-Schlüsselextraktion wird vorbereitet ...");
    progress.setProgress(5);
    online.connect();
    try {
        var status = OPTO_invokeFunctionProperty(online, [0x18]);
        if (!status || status.length < 11 || status[0] != 0) {
            throw new Error("io-homecontrol: Ungültige Statusantwort während der 2W-Übernahme");
        }

        var phase = status[1] || 0;
        if (phase == 0 || phase == 5 || phase == 6) {
            var resp = OPTO_invokeFunctionProperty(online, [0x17]);
            if (!resp || resp.length < 1) {
                throw new Error("io-homecontrol: Keine Antwort beim Start der 2W-Schlüsselextraktion");
            }
            if (resp[0] != 0) {
                throw new Error("io-homecontrol: 2W-Schlüsselextraktion ist gerade blockiert");
            }

            OPTO_setExtractionResult(device, "Extraktion läuft", []);
            progress.setText("2W-Schlüsselextraktion aktiv. Jetzt am Fremd-Gateway 'Gerät hinzufügen' starten und diese Schaltfläche danach erneut drücken.");
            progress.setProgress(100);
            return;
        }

        if (phase == 1) {
            progress.setText("Schlüsselextraktion läuft. Am Fremd-Gateway 'Gerät hinzufügen' starten und diese Schaltfläche danach erneut drücken.");
            progress.setProgress(100);
            return;
        }
        if (phase == 2) {
            var hubNode = OPTO_readNodeId(status, 2);
            var extractionNode = OPTO_readNodeId(status, 5);
            var nodeVerificationSeen = (status[24] || 0) != 0;
            var nodeVerificationAuthDone = (status[25] || 0) != 0;
            OPTO_setExtractionResult(device,
                                     nodeVerificationAuthDone
                                         ? "Schlüssel extrahiert; Node-Verifikation authentifiziert"
                                         : nodeVerificationSeen
                                         ? "Schlüssel extrahiert; Node-Verifikation beantwortet"
                                         : "Schlüssel extrahiert; Prüfung läuft",
                                     []);
            progress.setText("2W-Schlüssel erfolgreich extrahiert (Gateway-/System-Node-ID " +
                             OPTO_formatNodeId(hubNode) + ", temporäre Extraction-Device-ID " +
                             OPTO_formatNodeId(extractionNode) + "). " +
                             (nodeVerificationAuthDone
                                  ? "Die Node-Verifikation wurde authentifiziert. "
                                  : nodeVerificationSeen
                                  ? "Die Node-Verifikation wurde beantwortet. "
                                  : "Warte auf die Abschlussprüfung des Fremd-Gateways. ") +
                             "Diese Schaltfläche danach erneut drücken.");
            progress.setProgress(100);
            return;
        }
        if (phase == 3) {
            var nodeVerificationSeen = (status[24] || 0) != 0;
            var nodeVerificationAuthDone = (status[25] || 0) != 0;
            OPTO_setExtractionResult(device,
                                     nodeVerificationAuthDone
                                         ? "Schlüssel extrahiert; Node-Verifikation authentifiziert"
                                         : nodeVerificationSeen
                                         ? "Schlüssel extrahiert; Node-Verifikation beantwortet"
                                         : "Schlüssel extrahiert; Node-Verifikation nicht beobachtet",
                                     []);
            progress.setText("2W-Schlüsselextraktion abgeschlossen. " +
                             (nodeVerificationAuthDone
                                  ? "Die Node-Verifikation wurde authentifiziert. "
                                  : nodeVerificationSeen
                                  ? "Die Node-Verifikation wurde beantwortet; eine zusätzliche Authentifizierungsrunde war optional. "
                                  : "Es wurde keine Node-Verifikation beobachtet; der Schlüssel wurde dennoch erfolgreich extrahiert. ") +
                             "Die authentifizierte Gerätesuche läuft; diese Schaltfläche danach erneut drücken.");
            progress.setProgress(100);
            return;
        }
        if (phase != 4) {
            throw new Error("io-homecontrol: Unbekannter Status der 2W-Schlüsselübernahme");
        }

        var resultCount = status[8] || 0;
        var overflow = (status[10] || 0) != 0;
        var discoveries = [];
        var nodeIds = [];
        for (var resultIndex = 0; resultIndex < resultCount; resultIndex++) {
            var found = OPTO_invokeFunctionProperty(online, [0x19, resultIndex]);
            if (!found || found.length < 11 || found[0] != 0) {
                throw new Error("io-homecontrol: Scan-Ergebnis " + (resultIndex + 1) + " konnte nicht gelesen werden");
            }
            var discovery = {
                index: resultIndex,
                nodeId: OPTO_readNodeId(found, 3),
                protocolType: (found[6] || 0) | ((found[7] || 0) << 8),
                subtype: found[8] || 0,
                manufacturer: found[9] || 0,
                powerClass: found[10] || 0
            };
            discoveries.push(discovery);
            nodeIds.push(discovery.nodeId);
        }

        var channelCount = context && context.channelCount ? context.channelCount : 16;
        var channelActive = [];
        var assignmentRequest = [0x1C, channelCount];
        for (var channelIndex = 0; channelIndex < channelCount; channelIndex++) {
            var activeParameter = OPTO_getParameter(device, "OPTO_c" + (channelIndex + 1) + "Active");
            var isActive = activeParameter && Number(activeParameter.value) == 1;
            channelActive[channelIndex] = isActive;
            assignmentRequest.push(channelIndex);
        }

        var configuredChannels = 0;
        var alreadyConfigured = 0;
        var unassigned = 0;
        var assignmentResponse = OPTO_invokeFunctionProperty(online, assignmentRequest);
        if (!assignmentResponse || assignmentResponse.length < 2 || assignmentResponse[0] != 0 ||
            assignmentResponse[1] != discoveries.length ||
            assignmentResponse.length < 2 + (discoveries.length * 2)) {
            throw new Error("io-homecontrol: Geräte konnten nicht gesammelt zugeordnet werden");
        }
        for (var d = 0; d < discoveries.length; d++) {
            var assignmentStatus = assignmentResponse[2 + (d * 2)];
            var assignedChannel = assignmentResponse[3 + (d * 2)];
            if (assignmentStatus == 0) {
                OPTO_configureImportedChannel(device, assignedChannel + 1, discoveries[d]);
                channelActive[assignedChannel] = true;
                configuredChannels++;
            } else if (assignmentStatus == 1) {
                if (assignedChannel < channelCount && !channelActive[assignedChannel]) {
                    OPTO_configureImportedChannel(device, assignedChannel + 1, discoveries[d]);
                    channelActive[assignedChannel] = true;
                    configuredChannels++;
                } else {
                    alreadyConfigured++;
                }
            } else if (assignmentStatus == 2) {
                unassigned++;
            } else {
                throw new Error("io-homecontrol: Scan-Ergebnis " + (d + 1) + " ist nicht mehr verfügbar");
            }
            progress.setProgress(80 + Math.floor(((d + 1) * 15) / Math.max(1, discoveries.length)));
        }

        var saveResp = OPTO_invokeFunctionProperty(online, [0x1B]);
        if (!saveResp || saveResp.length < 1 || saveResp[0] != 0) {
            throw new Error("io-homecontrol: Schlüsselübernahme konnte nicht abgeschlossen werden");
        }

        var nodeText = nodeIds.length ? nodeIds.map(OPTO_formatNodeId).join(", ") : "keine";
        var summary = configuredChannels + " importiert, " + alreadyConfigured + " vorhanden";
        if (unassigned > 0) {
            summary += ", " + unassigned + " ohne freien Kanal";
        }
        if (overflow) {
            summary += ", weitere Ergebnisse verworfen";
        }
        var resultStatus = resultCount == 0
                               ? "Schlüssel extrahiert; keine Geräte gefunden"
                               : (configuredChannels > 0
                                      ? "Erfolgreich; Programmierung nötig"
                                      : "Erfolgreich; keine Änderung");
        OPTO_setExtractionResult(device, resultStatus, nodeIds);

        if (resultCount == 0) {
            progress.setText("2W-Schlüssel erfolgreich extrahiert, aber die anschließende authentifizierte Gerätesuche hat keine Geräte gefunden.");
        } else if (configuredChannels > 0) {
            progress.setText("2W-Schlüssel erfolgreich extrahiert. Gefundene Node-IDs: " + nodeText +
                             ". " + summary + ". Das KNX-Gerät muss jetzt in ETS neu programmiert werden, bevor die Geräte gesteuert werden können.");
        } else {
            progress.setText("2W-Schlüssel erfolgreich extrahiert. Geräte wurden gefunden, es waren jedoch keine ETS-Änderungen notwendig. Gefundene Node-IDs: " +
                             nodeText + ". " + summary + ".");
        }
        progress.setProgress(100);
    } finally {
        online.disconnect();
    }
}

function OPTO_Warmwasser_lesen(context) {;}
function OPTO_Warmwasser_speichern(context) {;}
function OPTO_Verdichter_lesen(context) {;}
function OPTO_Verdichter_speichern(context) {;}
function OPTO_Heizkreis_2_lesen(context) {;}
function OPTO_Heizkreis_2_speichern(context) {;}
function OPTO_Heizkreis_3_lesen(context) {;}
function OPTO_Heizkreis_3_speichern(context) {}
function OPTO_Schaltzeiten_Warmwasser_lesen(context) {;}
function OPTO_Schaltzeiten_Warmwasser_speichern(context) {;}
function OPTO_Schaltzeiten_Heizkreis_1_lesen(context) {;}
function OPTO_Schaltzeiten_Heizkreis_1_speichern(context) {;}
function OPTO_Schaltzeiten_Heizkreis_2_lesen(context) {;}
function OPTO_Schaltzeiten_Heizkreis_2_speichern(context) {;}
function OPTO_Schaltzeiten_Heizkreis_3_lesen(context) {;}
function OPTO_Schaltzeiten_Heizkreis_3_speichern(context) {;}
function OPTO_Schaltzeiten_Verdichter_Geraeuschreduzierter_Betrieb_lesen(device, online, progress, context)
{
    progress.setProgress(5);
}
function OPTO_Schaltzeiten_Verdichter_Geraeuschreduzierter_Betrieb_speichern(device, online, progress, context)
{
    progress.setProgress(5);
}
