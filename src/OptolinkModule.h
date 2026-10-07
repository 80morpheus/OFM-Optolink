#pragma once
#include "OpenKNX.h"
#include <VitoWiFi.h>
#ifdef 200A
#include "200A.adressen.h"
#endif
#ifdef 250A
#include "250A.adressen.h"
#endif
#ifdef 300A
#include "300A.adressen.h"
#endif



class OptolinkModule : public OpenKNX::Module
{
  private:
       




    void setupCustomFlash();
    void setupChannels();
    void setupFrontPlate();
    void setupVoltageMeasurement();
    void setupConstantCurrentMode();

  public:
    unsigned long int IntervalTimer[100] = 0; //millis letzter aufruf speichern
    uint16_t ParamTime[100] = 0; // jedweilige zeit des parameters
    uint16_t ParamAddr[100] = 0; // jeweilige adresse des parameters
    uint8_t ParamLength[100] = 0; // jeweilige länge des parameters
    uint8_t Warteliste[100] = 0;  // aktuelle warteliste


    void loop(bool configured) override;
    void setup(bool configured) override;
#ifdef OPENKNX_DUALCORE
    void loop1(bool configured) override;
    void setup1(bool configured) override;
#endif
    const std::string name() override;
    const std::string version() override;
    void processInputKo(GroupObject &ko) override;
    bool processCommand(const std::string cmd, bool diagnoseKo);
    void savePower() override;
    void showHelp() override;

    enum LightType
    {
        Single = 1,
        TunableWhite = 2,
        RGB = 3,
        RGBW = 4,
        RGBTW = 5
    };
};

extern OptolinkModule openknxOptolinkModule;
