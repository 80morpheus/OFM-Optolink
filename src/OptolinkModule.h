#pragma once
#include "OpenKNX.h"
#include <VitoWiFi.h>
//#include <OptolinkP300.hpp>
#include <functional>

#if (defined(OPTOMODULE_200A) + defined(OPTOMODULE_250A) + defined(OPTOMODULE_300A)) > 1
#error "Define only one Optolink model"
#endif

#if !defined(OPTOMODULE_200A) && !defined(OPTOMODULE_250A) && !defined(OPTOMODULE_300A)
#define OPTOMODULE_200A
#endif

#if defined(OPTOMODULE_200A)
#define OPTOMODULE_Modell "200A"
#elif defined(OPTOMODULE_250A)
#define OPTOMODULE_Modell "250A"
#else
#define OPTOMODULE_Modell "300A"
#endif


#if defined(OPTOMODULE_200A)
#include "Optolink_200A_Adressen.h"
#endif

#if defined(OPTOMODULE_300A)
#include "Optolink_300A_Adressen.h"
#endif


class OptolinkModule : public OpenKNX::Module
{
  private:
    void VitoWiFi_onError();
    void VitoWifi_onResponse();
    //VitoWiFi::VitoWiFi<VitoWiFi::VS2> vitoWiFi{&SERIAL1};
    void CheckTimeoutInterval();
    void WartelisteAbarbeiten();




    void setupCustomFlash();
    void setupChannels();
    void setupFrontPlate();
    void setupVoltageMeasurement();
    void setupConstantCurrentMode();

  public:
    OptolinkModule();

    unsigned long int IntervalTimer[100] = {}; //millis letzter aufruf speichern
    uint16_t ParamTime[100] = {}; // jedweilige zeit des parameters
    uint8_t Warteliste[100] = {};  // aktuelle warteliste
    //OptolinkP300 _optolinkP300;
    struct Datapoint {
        uint16_t address;
        uint8_t length;
        uint8_t divider;
        uint16_t interval;
    };
    Datapoint Datapoints_Abfrage[100] = {};
    Datapoint Datapoints_Konfiguration_WW[100] = {};
    Datapoint Datapoints_Konfiguration_Verdichter[100] = {};
    Datapoint Datapoints_Schaltzeiten_HK1[100] = {};
    Datapoint Datapoints_Schaltzeiten_HK2[100] = {};
    Datapoint Datapoints_Schaltzeiten_HK3[100] = {};
    Datapoint Datapoints_Schaltzeiten_WW[100] = {};
    Datapoint Datapoints_Schaltzeiten_GR[100] = {};

    virtual void Adressen_Abfrage();
    virtual void Adressen_Konfiguration_WW();
    virtual void Adressen_Konfiguration_Verdichter();
    virtual void Adressen_Schaltzeiten_HK1();
    virtual void Adressen_Schaltzeiten_HK2();
    virtual void Adressen_Schaltzeiten_HK3();
    virtual void Adressen_Schaltzeiten_WW();
    virtual void Adressen_Schaltzeiten_GR();
    
      
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
    void showHelp() override;



};



extern OptolinkModule openknxOptolinkModule;

