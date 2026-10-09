#include "OptolinkModule.h"
#include "OpenKNX.h"

const std::string OptolinkModule::name()
{
    return OptolinkMODULE_HARDWARE_NAME;
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

    logInfoP("Init:");
    logIndentUp();
    logIndentDown();
    logInfoP("Setup0:");
    logIndentUp();
    logIndentDown();
}

void LedModule::setupChannels()
{
    logDebugP("Setting up channels");
    logIndentUp();

    logDebugP("Channel setup finished.");
    logIndentDown();
}

void LedModule::setupFrontPlate()
{
#ifdef LEDMODULE_FRONT_PLATE_USED
    logDebugP("Front plate used");
    for (uint8_t i = 0; i < LEDMODULE_MAX_LIGHT_CHANNELS; i++)
    {
        openknx.gpio.pinMode(0x0100 + i, OUTPUT, true, !OPENKNX_LED_GPIO_OUTPUT_ACTIVE_ON);
        openknx.gpio.pinMode(0x0200 + i, INPUT);
    }
#endif
}

void LedModule::setupCustomFlash()
{
    logDebugP("initialize ledModule flash");
    OpenKNX::Flash::Driver _ledStorage;
#ifdef ARDUINO_ARCH_ESP32
    _ledStorage.init("ledModule");
#else
    // TODO: Reactivate flash storage when values are know and functionality is needed
    // _ledStorage.init("ledModule", LEDMODULE_FLASH_OFFSET, LEDMODULE_FLASH_SIZE);
#endif

    // logTraceP("write ledModule data");
    // _ledStorage.writeByte(0, 0x11);
    // _ledStorage.writeWord(1, 0xFFFF);
    // _ledStorage.writeInt(3, 6666666);
    // _ledStorage.commit();

    // logDebugP("read ledModule data");
    // logIndentUp();
    // logHexDebugP(_ledStorage.flashAddress(), 7);
    // logDebugP("byte: %02X", _ledStorage.readByte(0)); // UINT8
    // logDebugP("word: %i", _ledStorage.readWord(1));   // UINT16
    // logDebugP("int: %i", _ledStorage.readInt(3));     // UINT32
    // logIndentDown();
}

void OptolinkModule::loop(bool configured)
{
    if (delayCheck(_timer1, 5100))
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
    }
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

    uint16_t asap = ko.asap();
    uint16_t channelnumber = 0;

    if (asap >= LED_SC_KoBlockOffset && asap < LED_TW_KoBlockOffset)
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
    }
}

void OptolinkModule::showHelp()
{
    openknx.console.printHelpLine("led info", "Print ledModule configuration");
    openknx.console.printHelpLine("led state", "Print ledModule status");
    openknx.console.printHelpLine("led lut", "Print LED LUT");
    openknx.console.printHelpLine("led test mode", "Simple hardware test mode (currently RP2040 only)");
}

bool OptolinkModule::processCommand(const std::string cmd, bool diagnoseKo)
{
    if (cmd.substr(0, 3) != "led")
        return false;

    if (cmd.length() == 8 && cmd.substr(4, 4) == "info")
    {
        logInfoP("======================== Information ===========================================");
        logIndentUp();
        logInfoP("LED MODULE INFORMATION");
        logInfoP("PWM driver:              %s", LEDMODULE_PWMDRIVER);
#ifdef LEDMODULE_DIMMER_PCA9685
        logInfoP("1Wire SDA:              %s", LEDMODULE_WIRE_SDA);
        logInfoP("1Wire SCL:              %s", LEDMODULE_WIRE_SCL);
#endif
#ifdef LEDMODULE_DIMMMER_RP2040
        std::string tmp = "RP2040 Dimming Pins: ";
        for (int i = 0; i < LEDMODULE_MAX_LIGHT_CHANNELS; i++)
        {
            tmp.append(std::to_string(dimPins[i]));
            tmp.append(", ");
        }
        logInfoP("%s", tmp.c_str());
#endif
        logInfoP("HW Channel configuration:");
        logInfoP("CH\tTYPE\tSC\tTW\tFunc\tRGB\tFunc");
        for (int _channelIndex = 0; _channelIndex < LED_ChannelCount; _channelIndex++)
        {
            logInfoP("%d\t%d\t%d\t%d\t%d\t%d\t%d", _channelIndex, ParamLED_CH_Lighttype, ParamLED_CH_SC_Light, ParamLED_CH_TW_Light, ParamLED_CH_TW_Function, ParamLED_CH_RGB_Light, ParamLED_CH_RGB_Function);
        }
        for (int i = 0; i < LED_SC_ChannelCount; i++)
        {
            logInfoP("SC %d: CH: %d", i, _SC_HWChannels[i][0]);
        }
        for (int i = 0; i < LED_TW_ChannelCount; i++)
        {
            logInfoP("TW %d: Cold: %d, Warm: %d", i, _TW_HWChannels[i][0], _TW_HWChannels[i][1]);
        }
        for (int i = 0; i < LED_RGB_ChannelCount; i++)
        {
            logInfoP("RGB %d: Red: %d, Green: %d, Blue: %d", i, _RGB_HWChannels[i][0], _RGB_HWChannels[i][1], _RGB_HWChannels[i][2]);
        }
        logIndentDown();
        logInfoP("--------------------------------------------------------------------------------");
        return true;
    }

    if (cmd.length() == 9 && cmd.substr(4, 5) == "state")
    {
        logInfoP("======================== Information ===========================================");
        logInfoP("LED MODULE STATE INFORMATION");
        for (int i = 0; i < LED_ChannelCount; i++)
        {
            logInfoP("CH%d: %d", i, _pDimmer->getLevel(i));
        }
        logInfoP("--------------------------------------------------------------------------------");
        return true;
    }

    if (cmd.length() == 7 && cmd.substr(4, 3) == "lut")
    {
        logInfoP("======================== Information ===========================================");
        logInfoP("LED MODULE LUT INFORMATION");

        //_pDimmer->outputLUT();
        // HWDimmer::outputLUT();

        logInfoP("--------------------------------------------------------------------------------");
        return true;
    }

    if (cmd.length() == 13 && cmd.substr(4, 9) == "test mode")
    {
        logDebugP("Running LED hardware test mode");
        logIndentUp();

        logDebugP("All LEDs to maximum brightness");
        for (uint8_t ch = 0; ch < LEDMODULE_MAX_LIGHT_CHANNELS; ch++)
            openknx.gpio.pinMode(dimPins[ch], OUTPUT, true, HIGH);

        delay(30000);

        logDebugP("All LEDs off");
        for (uint8_t ch = 0; ch < LEDMODULE_MAX_LIGHT_CHANNELS; ch++)
            openknx.gpio.digitalWrite(dimPins[ch], LOW);

        logDebugP("Test mode finished");
        logIndentDown();
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
            bool Test = 1;
            uint8 Pos = 1 while Test do : if (Warteliste[Pos] == 0)
            {
                Warteliste[Pos] = i;
                Test = 0; // springt aus while schleife
            }
        end:;
        }
    }
}

void OptolinkModule::WartelisteAbarbeiten()
{
    wenn warteliste[1] != 0 dann
    {
        wenn kommunikation nicht aktiv dann
        {
            nimm position 1 der liste und übergib es an den vitowifi(ParamAddr, ParamLenght) for (int i = 0; i < 99; i++) { Warteliste[i] = Warteliste[i + 1] }
        }
    }
}

OptolinkModule openknxOptolinkModule;
