#pragma once




#include "OpenKNX.h"
#include <Arduino.h>

class Optolink_200A : public OpenKNX::Channel
{
  public:
    Optolink_200A();
    void Adressen_Abfrage();
    void Adressen_Konfiguration_WW();
    void Adressen_Konfiguration_Verdichter();
    void Adressen_Schaltzeiten_HK1();
    void Adressen_Schaltzeiten_HK2();
    void Adressen_Schaltzeiten_HK3();
    void Adressen_Schaltzeiten_WW();
    void Adressen_Schaltzeiten_GR();

    //void processInputKo(GroupObject& ko);
    //void update();
    //void loop();
    //Datapoint Datapoints_Abfrage[100] = {};
    //Datapoint Datapoints_Konfiguration_WW[100] = {};
    //Datapoint Datapoints_Konfiguration_Verdichter[100] = {};
    //Datapoint Datapoints_Schaltzeiten_HK1[100] = {};
    //Datapoint Datapoints_Schaltzeiten_HK2[100] = {};
    //Datapoint Datapoints_Schaltzeiten_HK3[100] = {};
    //Datapoint Datapoints_Schaltzeiten_WW[100] = {};
    //Datapoint Datapoints_Schaltzeiten_GR[100] = {};



  private:
    //const std::string name() override;

    //void handleScene(uint8_t sceneNr);

};