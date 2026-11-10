#include "OptolinkModule.h"
#include "OpenKNX.h"
#include <utility>
#include <VitoWiFi.h>



OptolinkModule::OptolinkModule() = default;

const std::string OptolinkModule::name()
{
    return "OptolinkMODULE";
}

const std::string OptolinkModule::version()
{
    // hides the module in the version output on the console, because the firmware version is sufficient.
    return "";
}

void OptolinkModule::setup(bool configured)
{    
    if (!configured)
    {
        logInfoP("Setup: not configured");
        return;
    }

    logInfoP("VitoWiFi");
    //VitoWiFi_setProtocol(P300);
    //DPRaw raw_dp("RAW", "DP", 0x0000);



    logInfoP("Init:");
    logIndentUp();
    logIndentDown();
    logInfoP("Setup0:");
    logIndentUp();
    logIndentDown();
}




void OptolinkModule::loop(bool configured)
{
    //_vitoWiFi.loop();

    /*if (delayCheck(_timer1, 5100))
    {
        logDebugP("Loop0");
        _timer1 = millis();
    }

    if (knx.configured())
    {
        if (delayCheck(_timerCheckConnection, 500))
        {
            _timerCheckConnection = millis();
        }
        CheckTimeoutInterval();
        WartelisteAbarbeiten();
    }*/
}

#ifdef OPENKNX_DUALCORE

void OptolinkModule::setup1(bool configured)
{
    delay(1000);
    logInfoP("Setup1");
}

void OptolinkModule::loop1(bool configured)
{
    if (delayCheck(_timer2, 7200))
    {
        logInfoP("Loop1");
        _timer2 = millis();
    }
}
#endif



void OptolinkModule::processInputKo(GroupObject &ko)
{
    // logDebugP("proc.Ko GA%04X", ko.asap());
    // logHexDebugP(ko.valueRef(), ko.valueSize());

    //uint16_t asap = ko.asap();
    //uint16_t channelnumber = 0;

    /*if (asap >= LED_SC_KoBlockOffset && asap < LED_TW_KoBlockOffset)
    {
        channelnumber = (asap - LED_SC_KoBlockOffset) / LED_SC_KoBlockSize;
        logDebugP("SC %d", channelnumber);
        _singleChannels[channelnumber]->processInputKo(ko);
    }
    else if (asap >= LED_TW_KoBlockOffset && asap < LED_RGB_KoBlockOffset)
    {
        channelnumber = (asap - LED_TW_KoBlockOffset) / LED_TW_KoBlockSize;
        logDebugP("TW %d", channelnumber);
        _twChannels[channelnumber]->processInputKo(ko);
    }
    else if (asap >= LED_RGB_KoBlockOffset && asap < (LED_RGB_KoBlockOffset + LED_RGB_ChannelCount * LED_RGB_KoBlockSize))
    {
        channelnumber = (asap - LED_RGB_KoBlockOffset) / LED_RGB_KoBlockSize;
        logDebugP("RGB %d", channelnumber);
        _rgbChannels[channelnumber]->processInputKo(ko);
    }*/
}

void OptolinkModule::showHelp()
{
    openknx.console.printHelpLine("opto info", "Print OptolinkModule configuration");
    openknx.console.printHelpLine("opto state", "Print OptolinkModule status");
    openknx.console.printHelpLine("opto request address length", "Print request of address(2Byte HEX) with length(1/2/3)");

}

bool OptolinkModule::processCommand(const std::string cmd, bool diagnoseKo)
{
    if (cmd.substr(0, 3) != "led")
        return false;

    if (cmd.length() == 9 && cmd.substr(5, 4) == "info")
    {
        logInfoP("======================== Information ===========================================");
        logIndentUp();
        logInfoP("Optolink MODULE INFORMATION");
        //logInfoP("Heater Typer:           %s", OPTOMODULE_HEATERTYPE);
#ifdef OPTOMODULE_200A
        logInfoP("Wärmepumpe:              %s", OPTOMODULE_Modell);
#endif
#ifdef OPTOMODULE_250A
        logInfoP("Wärmepumpe:              %s", OPTOMODULE_Modell);
#endif
#ifdef OPTOMODULE_300A
        logInfoP("Wärmepumpe:              %s", OPTOMODULE_Modell);
#endif
        logInfoP("Parameter Abfrage configuration:");
        logIndentDown();
        logInfoP("--------------------------------------------------------------------------------");
        return true;
    }

    if (cmd.length() == 10 && cmd.substr(5, 5) == "state")
    {
        logInfoP("======================== Information ===========================================");
        logInfoP("OPTOLINK MODULE STATE INFORMATION");
        
        logInfoP("--------------------------------------------------------------------------------");
        return true;
    }

    if (cmd.length() == 19 && cmd.substr(5, 7) == "request")
    {
        logInfoP("======================== Information ===========================================");
        logInfoP("OPTOLINK MODULE ADDRESS REQUEST");

        // request address

        logInfoP("--------------------------------------------------------------------------------");
        return true;
    }



    return false;
}

void OptolinkModule::CheckTimeoutInterval()
{
    for (int i = 0; i < 100; i++)
    {
        if (IntervalTimer[i] + ParamTime[i] < millis())
        {
            const uint8_t queuedIndex = static_cast<uint8_t>(i + 1);
            uint16_t freePosition = 100;
            bool alreadyQueued = false;
            for (uint16_t pos = 1; pos < 100; pos++)
            {
                if (Warteliste[pos] == queuedIndex)
                {
                    alreadyQueued = true;
                    break;
                }
                if (Warteliste[pos] == 0 && freePosition == 100)
                {
                    freePosition = pos;
                }
            }
            if (!alreadyQueued && freePosition < 100)
            {
                Warteliste[freePosition] = queuedIndex;
            }
        }
    }
}

void OptolinkModule::WartelisteAbarbeiten()
{
    /*wenn warteliste[1] != 0 dann
    {
        wenn kommunikation nicht aktiv dann
        {
            nimm position 1 der liste und übergib es an den vitowifi(ParamAddr, ParamLenght) for (int i = 0; i < 99; i++) { Warteliste[i] = Warteliste[i + 1] }
        }
    }*/
}

OptolinkModule openknxOptolinkModule;
