'use strict';
//
// Generator katalogu syntetycznego (~20 000+ pozycji).
//
// Założenia bezpieczeństwa danych (rozmowa biznesowa: "podawaj moce takie
// bardzo bezpieczne, oddalone od faktycznego limitu, żeby nie deklarować
// czegoś..."):
//
//   * Diesele turbo: +8% mocy, +9% momentu (typowe Stage 1 to 25-35%)
//   * Benzyna doładowana: +6% mocy, +7% momentu (typowe Stage 1: 15-25%)
//   * Benzyna wolnossąca: +2% mocy, +2% momentu (typowe Stage 1: 4-8%)
//
// Każdy wygenerowany rekord jest oznaczony `synthetic: true` i nigdy nie
// jest serwowany jako statyczna strona - katalog/wyszukiwarka linkuje go do
// dynamicznej strony /tuning/?slug=... która zaznacza, że są to wartości
// szacunkowe potwierdzane finalnie pomiarem na hamowni.
//
// Cały generator jest deterministyczny (brak Math.random), więc wynik nie
// zmienia się między buildami i jest cache-friendly.

// ------------------------------ POOLE SILNIKÓW ------------------------------
//
// Każdy "pool" to lista wariantów silnika z konkretną mocą, momentem,
// pojemnością, sterownikiem ECU, charakterem (diesel/petrol_turbo/petrol_na)
// i rozsądnymi alternatywnymi nazwami silnika. Generator wybiera wszystkie
// warianty z poola dla każdej generacji modelu.

const POOLS = {
  // ---------- VAG (VW/Audi/Skoda/Seat) ----------
  vag_diesel: [
    { silnik: '1.4 TDI 70',  km: 70,  nm: 155, ecu: 'Bosch EDC15P+', cap: 1.4 },
    { silnik: '1.4 TDI 75',  km: 75,  nm: 195, ecu: 'Bosch EDC16U1', cap: 1.4 },
    { silnik: '1.4 TDI 80',  km: 80,  nm: 195, ecu: 'Bosch EDC16U1', cap: 1.4 },
    { silnik: '1.6 TDI 75',  km: 75,  nm: 195, ecu: 'Bosch EDC17C46', cap: 1.6 },
    { silnik: '1.6 TDI 90',  km: 90,  nm: 230, ecu: 'Bosch EDC17C46', cap: 1.6 },
    { silnik: '1.6 TDI 105', km: 105, nm: 250, ecu: 'Bosch EDC17C46', cap: 1.6 },
    { silnik: '1.6 TDI 110', km: 110, nm: 250, ecu: 'Bosch EDC17C64', cap: 1.6 },
    { silnik: '1.6 TDI 115', km: 115, nm: 250, ecu: 'Bosch EDC17C64', cap: 1.6 },
    { silnik: '1.9 SDI 64',  km: 64,  nm: 125, ecu: 'Bosch EDC15M',   cap: 1.9 },
    { silnik: '1.9 TDI 90',  km: 90,  nm: 210, ecu: 'Bosch EDC15P',   cap: 1.9 },
    { silnik: '1.9 TDI 100', km: 100, nm: 240, ecu: 'Bosch EDC15P+',  cap: 1.9 },
    { silnik: '1.9 TDI 105', km: 105, nm: 250, ecu: 'Bosch EDC16U1',  cap: 1.9 },
    { silnik: '1.9 TDI 115', km: 115, nm: 285, ecu: 'Bosch EDC15P+',  cap: 1.9 },
    { silnik: '1.9 TDI 130', km: 130, nm: 310, ecu: 'Bosch EDC15P+',  cap: 1.9 },
    { silnik: '1.9 TDI 150', km: 150, nm: 320, ecu: 'Bosch EDC15P+',  cap: 1.9 },
    { silnik: '2.0 TDI 110', km: 110, nm: 250, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 115', km: 115, nm: 280, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 122', km: 122, nm: 280, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 136', km: 136, nm: 320, ecu: 'Bosch EDC16U31', cap: 2.0 },
    { silnik: '2.0 TDI 140', km: 140, nm: 320, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 143', km: 143, nm: 320, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 150', km: 150, nm: 340, ecu: 'Bosch EDC17C64', cap: 2.0 },
    { silnik: '2.0 TDI 163', km: 163, nm: 350, ecu: 'Bosch EDC16U31', cap: 2.0 },
    { silnik: '2.0 TDI 170', km: 170, nm: 350, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 177', km: 177, nm: 380, ecu: 'Bosch EDC17C46', cap: 2.0 },
    { silnik: '2.0 TDI 184', km: 184, nm: 380, ecu: 'Bosch EDC17C64', cap: 2.0 },
    { silnik: '2.0 TDI 190', km: 190, nm: 400, ecu: 'Bosch EDC17C74', cap: 2.0 },
    { silnik: '2.0 TDI 200', km: 200, nm: 400, ecu: 'Bosch EDC17C74', cap: 2.0 },
    { silnik: '2.0 TDI 240', km: 240, nm: 500, ecu: 'Bosch EDC17C74', cap: 2.0 },
    { silnik: '2.5 TDI V6 150', km: 150, nm: 310, ecu: 'Bosch EDC15VM+', cap: 2.5 },
    { silnik: '2.5 TDI V6 163', km: 163, nm: 310, ecu: 'Bosch EDC15VM+', cap: 2.5 },
    { silnik: '2.5 TDI V6 180', km: 180, nm: 370, ecu: 'Bosch EDC16U1', cap: 2.5 },
    { silnik: '2.7 TDI V6 180', km: 180, nm: 380, ecu: 'Bosch EDC17CP04', cap: 2.7 },
    { silnik: '2.7 TDI V6 190', km: 190, nm: 400, ecu: 'Bosch EDC17CP04', cap: 2.7 },
    { silnik: '3.0 TDI V6 204', km: 204, nm: 450, ecu: 'Bosch EDC17CP44', cap: 3.0 },
    { silnik: '3.0 TDI V6 224', km: 224, nm: 450, ecu: 'Bosch EDC17CP04', cap: 3.0 },
    { silnik: '3.0 TDI V6 240', km: 240, nm: 500, ecu: 'Bosch EDC17CP04', cap: 3.0 },
    { silnik: '3.0 TDI V6 245', km: 245, nm: 500, ecu: 'Bosch EDC17CP44', cap: 3.0 },
    { silnik: '3.0 TDI V6 272', km: 272, nm: 580, ecu: 'Bosch EDC17CP44', cap: 3.0 },
    { silnik: '3.0 TDI V6 286', km: 286, nm: 620, ecu: 'Bosch EDC17CP54', cap: 3.0 },
    { silnik: '4.2 TDI V8 326', km: 326, nm: 760, ecu: 'Bosch EDC17CP54', cap: 4.2 },
    { silnik: '4.2 TDI V8 351', km: 351, nm: 800, ecu: 'Bosch EDC17CP54', cap: 4.2 },
    { silnik: '4.2 TDI V8 385', km: 385, nm: 850, ecu: 'Bosch EDC17CP54', cap: 4.2 },
    { silnik: '6.0 TDI W12 500', km: 500, nm: 1000, ecu: 'Bosch EDC17CP54', cap: 6.0 },
  ],
  vag_petrol_turbo: [
    { silnik: '1.0 TSI 95',  km: 95,  nm: 175, ecu: 'Bosch MED17.5.25', cap: 1.0 },
    { silnik: '1.0 TSI 110', km: 110, nm: 200, ecu: 'Bosch MED17.5.25', cap: 1.0 },
    { silnik: '1.0 TSI 115', km: 115, nm: 200, ecu: 'Bosch MED17.5.25', cap: 1.0 },
    { silnik: '1.2 TSI 86',  km: 86,  nm: 160, ecu: 'Bosch MED17.5',    cap: 1.2 },
    { silnik: '1.2 TSI 90',  km: 90,  nm: 160, ecu: 'Bosch MED17.5',    cap: 1.2 },
    { silnik: '1.2 TSI 105', km: 105, nm: 175, ecu: 'Bosch MED17.5',    cap: 1.2 },
    { silnik: '1.2 TSI 110', km: 110, nm: 175, ecu: 'Bosch MED17.5',    cap: 1.2 },
    { silnik: '1.4 TSI 122', km: 122, nm: 200, ecu: 'Bosch MED17.5',    cap: 1.4 },
    { silnik: '1.4 TSI 125', km: 125, nm: 200, ecu: 'Bosch MED17.5',    cap: 1.4 },
    { silnik: '1.4 TSI 140', km: 140, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.4 },
    { silnik: '1.4 TSI 150', km: 150, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.4 },
    { silnik: '1.4 TSI 160 Twin', km: 160, nm: 240, ecu: 'Bosch MED17.5', cap: 1.4 },
    { silnik: '1.4 TSI 170', km: 170, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.4 },
    { silnik: '1.4 TSI 180 Twin', km: 180, nm: 250, ecu: 'Bosch MED17.5', cap: 1.4 },
    { silnik: '1.5 TSI 130', km: 130, nm: 200, ecu: 'Continental SIMOS18', cap: 1.5 },
    { silnik: '1.5 TSI 150', km: 150, nm: 250, ecu: 'Continental SIMOS18', cap: 1.5 },
    { silnik: '1.8 TSI 152', km: 152, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.8 },
    { silnik: '1.8 TSI 160', km: 160, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.8 },
    { silnik: '1.8 TSI 170', km: 170, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.8 },
    { silnik: '1.8 TSI 180', km: 180, nm: 250, ecu: 'Bosch MED17.5',    cap: 1.8 },
    { silnik: '2.0 TSI 200', km: 200, nm: 280, ecu: 'Bosch MED17.5.20', cap: 2.0 },
    { silnik: '2.0 TSI 210', km: 210, nm: 280, ecu: 'Bosch MED17.5.20', cap: 2.0 },
    { silnik: '2.0 TSI 220', km: 220, nm: 350, ecu: 'Bosch MED17.5.25', cap: 2.0 },
    { silnik: '2.0 TSI 230', km: 230, nm: 350, ecu: 'Bosch MED17.5.25', cap: 2.0 },
    { silnik: '2.0 TSI 245', km: 245, nm: 370, ecu: 'Bosch MED17.5.25', cap: 2.0 },
    { silnik: '2.0 TSI 252', km: 252, nm: 370, ecu: 'Bosch MED17.5.25', cap: 2.0 },
    { silnik: '2.0 TSI 265', km: 265, nm: 370, ecu: 'Bosch MED17.5.25', cap: 2.0 },
    { silnik: '2.0 TSI 280', km: 280, nm: 380, ecu: 'Bosch MED17.5.25', cap: 2.0 },
    { silnik: '2.0 TSI 300', km: 300, nm: 380, ecu: 'Bosch MG1CS001',   cap: 2.0 },
    { silnik: '2.0 TSI 310', km: 310, nm: 400, ecu: 'Bosch MG1CS001',   cap: 2.0 },
    { silnik: '2.0 TSI 320', km: 320, nm: 420, ecu: 'Bosch MG1CS001',   cap: 2.0 },
    { silnik: '2.5 TFSI 340',km: 340, nm: 465, ecu: 'Bosch MG1CS002',   cap: 2.5 },
    { silnik: '2.5 TFSI 400',km: 400, nm: 480, ecu: 'Bosch MG1CS002',   cap: 2.5 },
    { silnik: '3.0 TFSI 333',km: 333, nm: 440, ecu: 'Bosch MED17.1.6',  cap: 3.0 },
    { silnik: '3.0 TFSI 354',km: 354, nm: 500, ecu: 'Bosch MED17.1.62', cap: 3.0 },
    { silnik: '3.0 TFSI 444',km: 444, nm: 600, ecu: 'Bosch MED17.1.62', cap: 3.0 },
    { silnik: '4.0 TFSI V8 450',km: 450, nm: 600, ecu: 'Bosch MED17.1.62', cap: 4.0 },
    { silnik: '4.0 TFSI V8 520',km: 520, nm: 680, ecu: 'Bosch MED17.1.62', cap: 4.0 },
    { silnik: '4.0 TFSI V8 605',km: 605, nm: 750, ecu: 'Bosch MED17.1.62', cap: 4.0 },
    { silnik: '5.0 TFSI V10 580', km: 580, nm: 540, ecu: 'Bosch MED17.1.62', cap: 5.0 },
  ],
  vag_petrol_na: [
    { silnik: '1.0 MPI 60',  km: 60,  nm: 95,  ecu: 'Bosch ME17.5.21', cap: 1.0 },
    { silnik: '1.0 MPI 75',  km: 75,  nm: 95,  ecu: 'Bosch ME17.5.21', cap: 1.0 },
    { silnik: '1.0 MPI 80',  km: 80,  nm: 95,  ecu: 'Bosch ME17.5.21', cap: 1.0 },
    { silnik: '1.2 12V 60',  km: 60,  nm: 108, ecu: 'Bosch ME7.5.10',  cap: 1.2 },
    { silnik: '1.2 12V 65',  km: 65,  nm: 108, ecu: 'Bosch ME7.5.10',  cap: 1.2 },
    { silnik: '1.4 16V 75',  km: 75,  nm: 126, ecu: 'Bosch ME7.5.10',  cap: 1.4 },
    { silnik: '1.4 16V 86',  km: 86,  nm: 132, ecu: 'Bosch ME7.5.10',  cap: 1.4 },
    { silnik: '1.4 16V 100', km: 100, nm: 126, ecu: 'Bosch ME7.5.10',  cap: 1.4 },
    { silnik: '1.6 8V 75',   km: 75,  nm: 130, ecu: 'Bosch ME7.5.10',  cap: 1.6 },
    { silnik: '1.6 MPI 102', km: 102, nm: 148, ecu: 'Bosch ME17.5.21', cap: 1.6 },
    { silnik: '1.6 MPI 105', km: 105, nm: 153, ecu: 'Bosch ME17.5.21', cap: 1.6 },
    { silnik: '1.6 FSI 116', km: 116, nm: 155, ecu: 'Bosch MED7',      cap: 1.6 },
    { silnik: '2.0 MPI 115', km: 115, nm: 170, ecu: 'Siemens Simos 9.1', cap: 2.0 },
    { silnik: '2.0 FSI 150', km: 150, nm: 200, ecu: 'Bosch MED7',      cap: 2.0 },
    { silnik: '3.2 V6 250',  km: 250, nm: 320, ecu: 'Bosch ME7.1.1',   cap: 3.2 },
    { silnik: '3.6 V6 280',  km: 280, nm: 350, ecu: 'Bosch ME7.1.1',   cap: 3.6 },
  ],

  // ---------- BMW ----------
  //
  // Każdy model+generacja ma własną pulę silników (bo kody silników BMW
  // zawierają oznaczenie modelu: "318d" → Seria 3, "X5 30d" → X5).
  // Pools są nazwane bmw_<model>_<gen>. W brands BMW jest mapowany 1-do-1.
  //
  // Klucz "bmw_<model>" (bez generacji) to fallback dla generacji bez
  // dedykowanej puli (E-serie używają _diesel/_petrol_turbo/_petrol_na
  // wspólnych dla danego modelu).
  bmw_seria_1_e87: [
    { silnik: '116i 1.6', km: 122, nm: 160, ecu: 'Bosch MS45',       cap: 1.6 },
    { silnik: '118i 2.0', km: 143, nm: 190, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: '120i 2.0', km: 170, nm: 210, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: '125i 3.0', km: 218, nm: 270, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '130i 3.0', km: 265, nm: 315, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '116d 2.0', km: 116, nm: 260, ecu: 'Bosch EDC17CP02',  cap: 2.0 },
    { silnik: '118d 2.0', km: 143, nm: 300, ecu: 'Bosch EDC17CP02',  cap: 2.0 },
    { silnik: '120d 2.0', km: 177, nm: 350, ecu: 'Bosch EDC17CP02',  cap: 2.0 },
    { silnik: '123d 2.0', km: 204, nm: 400, ecu: 'Bosch EDC17CP02',  cap: 2.0 },
  ],
  bmw_seria_1_f20: [
    { silnik: '114i 1.6',  km: 102, nm: 180, ecu: 'Bosch MEVD17.2.4', cap: 1.6 },
    { silnik: '116i 1.6',  km: 136, nm: 220, ecu: 'Bosch MEVD17.2.4', cap: 1.6 },
    { silnik: '118i 1.5',  km: 136, nm: 220, ecu: 'Bosch MEVD17.2.5', cap: 1.5 },
    { silnik: '118i 2.0',  km: 170, nm: 250, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '120i 2.0',  km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '125i 2.0',  km: 218, nm: 310, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'M135i 3.0', km: 326, nm: 450, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'M140i 3.0', km: 340, nm: 500, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: '114d 1.6',  km: 95,  nm: 235, ecu: 'Bosch EDC17C50',   cap: 1.6 },
    { silnik: '116d 1.5',  km: 116, nm: 270, ecu: 'Bosch EDC17C50',   cap: 1.5 },
    { silnik: '116d 2.0',  km: 116, nm: 270, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '118d 2.0',  km: 150, nm: 320, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '120d 2.0',  km: 184, nm: 380, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '125d 2.0',  km: 224, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
  ],
  bmw_seria_1_f40: [
    { silnik: '116i 1.5',  km: 109, nm: 190, ecu: 'Bosch MG1CS201',   cap: 1.5 },
    { silnik: '118i 1.5',  km: 140, nm: 220, ecu: 'Bosch MG1CS201',   cap: 1.5 },
    { silnik: '120i 2.0',  km: 178, nm: 280, ecu: 'Bosch MG1CS003',   cap: 2.0 },
    { silnik: 'M135i xDrive 2.0', km: 306, nm: 450, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '116d 1.5',  km: 116, nm: 270, ecu: 'Bosch EDC17C50',   cap: 1.5 },
    { silnik: '118d 2.0',  km: 150, nm: 350, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '120d xDrive 2.0', km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
  ],
  bmw_seria_2_f22: [
    { silnik: '218i 1.5',   km: 136, nm: 220, ecu: 'Bosch MEVD17.2.5', cap: 1.5 },
    { silnik: '220i 2.0',   km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '228i 2.0',   km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '230i 2.0',   km: 252, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'M235i 3.0',  km: 326, nm: 450, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'M240i 3.0',  km: 340, nm: 500, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: '218d 2.0',   km: 150, nm: 330, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '220d 2.0',   km: 190, nm: 400, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '225d 2.0',   km: 224, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
  ],
  bmw_seria_2_g42: [
    { silnik: '220i 2.0',         km: 184, nm: 300, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '230i xDrive 2.0',  km: 245, nm: 400, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'M240i xDrive 3.0', km: 374, nm: 500, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: '220d 2.0',         km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
  ],
  bmw_seria_3_e46: [
    { silnik: '316i 1.6',  km: 105, nm: 150, ecu: 'Bosch ME7.2',  cap: 1.6 },
    { silnik: '316i 1.8',  km: 115, nm: 175, ecu: 'Bosch ME9.2',  cap: 1.8 },
    { silnik: '318i 2.0',  km: 143, nm: 200, ecu: 'Bosch MS43',   cap: 2.0 },
    { silnik: '320i 2.0',  km: 150, nm: 200, ecu: 'Bosch MS43',   cap: 2.0 },
    { silnik: '320i 2.2',  km: 170, nm: 210, ecu: 'Bosch MS45',   cap: 2.2 },
    { silnik: '325i 2.5',  km: 192, nm: 245, ecu: 'Bosch MS43',   cap: 2.5 },
    { silnik: '328i 2.8',  km: 193, nm: 280, ecu: 'Bosch MS42',   cap: 2.8 },
    { silnik: '330i 3.0',  km: 231, nm: 300, ecu: 'Bosch MS43',   cap: 3.0 },
    { silnik: '318d 2.0',  km: 116, nm: 280, ecu: 'Bosch EDC15C',  cap: 2.0 },
    { silnik: '320d 2.0',  km: 150, nm: 330, ecu: 'Bosch EDC16C', cap: 2.0 },
    { silnik: '330d 3.0',  km: 204, nm: 410, ecu: 'Bosch EDC16C', cap: 3.0 },
  ],
  bmw_seria_3_e90: [
    { silnik: '316i 1.6',  km: 122, nm: 160, ecu: 'Bosch MS45',       cap: 1.6 },
    { silnik: '318i 2.0',  km: 143, nm: 190, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: '320i 2.0',  km: 170, nm: 210, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: '323i 2.5',  km: 177, nm: 230, ecu: 'Bosch MSV70',      cap: 2.5 },
    { silnik: '325i 2.5',  km: 218, nm: 250, ecu: 'Bosch MSV70',      cap: 2.5 },
    { silnik: '325i 3.0',  km: 218, nm: 270, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '328i 3.0',  km: 234, nm: 280, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '330i 3.0',  km: 258, nm: 300, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '335i 3.0',  km: 306, nm: 400, ecu: 'Bosch MSD80',      cap: 3.0 },
    { silnik: '316d 2.0',  km: 115, nm: 260, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: '318d 2.0',  km: 143, nm: 300, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: '320d 2.0',  km: 184, nm: 380, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: '325d 3.0',  km: 197, nm: 400, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '330d 3.0',  km: 245, nm: 520, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '335d 3.0',  km: 286, nm: 580, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_3_f30: [
    { silnik: '316i 1.6',  km: 136, nm: 220, ecu: 'Bosch MEVD17.2.4', cap: 1.6 },
    { silnik: '318i 1.5',  km: 136, nm: 220, ecu: 'Bosch MEVD17.2.5', cap: 1.5 },
    { silnik: '320i 2.0',  km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '328i 2.0',  km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '330i 2.0',  km: 252, nm: 350, ecu: 'Bosch MG1CS003',   cap: 2.0 },
    { silnik: '335i 3.0',  km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '340i 3.0',  km: 326, nm: 450, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: '316d 2.0',  km: 116, nm: 260, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '318d 2.0',  km: 150, nm: 320, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '320d 2.0',  km: 184, nm: 380, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '325d 2.0',  km: 218, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '330d 3.0',  km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '335d 3.0',  km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_3_g20: [
    { silnik: '318i 2.0',         km: 156, nm: 250, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '320i 2.0',         km: 184, nm: 300, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '330i 2.0',         km: 258, nm: 400, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'M340i xDrive 3.0', km: 374, nm: 500, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: '316d 2.0',         km: 122, nm: 300, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '318d 2.0',         km: 150, nm: 320, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '320d 2.0',         km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '330d 3.0',         km: 286, nm: 650, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: 'M340d xDrive 3.0', km: 340, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_4_f32: [
    { silnik: '418i 1.5',  km: 136, nm: 220, ecu: 'Bosch MEVD17.2.5', cap: 1.5 },
    { silnik: '420i 2.0',  km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '428i 2.0',  km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '430i 2.0',  km: 252, nm: 350, ecu: 'Bosch MG1CS003',   cap: 2.0 },
    { silnik: '435i 3.0',  km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '440i 3.0',  km: 326, nm: 450, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: '418d 2.0',  km: 150, nm: 320, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '420d 2.0',  km: 184, nm: 380, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '425d 2.0',  km: 218, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '430d 3.0',  km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '435d 3.0',  km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_4_g22: [
    { silnik: '420i 2.0',         km: 184, nm: 300, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '430i 2.0',         km: 258, nm: 400, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'M440i xDrive 3.0', km: 374, nm: 500, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: '420d 2.0',         km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '430d xDrive 3.0',  km: 286, nm: 650, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: 'M440d xDrive 3.0', km: 340, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_5_e39: [
    { silnik: '520i 2.0',  km: 150, nm: 190, ecu: 'Bosch ME7.2',  cap: 2.0 },
    { silnik: '520i 2.2',  km: 170, nm: 210, ecu: 'Bosch MS43',   cap: 2.2 },
    { silnik: '523i 2.5',  km: 170, nm: 245, ecu: 'Bosch ME7.2',  cap: 2.5 },
    { silnik: '525i 2.5',  km: 192, nm: 245, ecu: 'Bosch MS43',   cap: 2.5 },
    { silnik: '528i 2.8',  km: 193, nm: 280, ecu: 'Bosch MS42',   cap: 2.8 },
    { silnik: '530i 3.0',  km: 231, nm: 300, ecu: 'Bosch MS43',   cap: 3.0 },
    { silnik: '535i 3.5',  km: 245, nm: 345, ecu: 'Bosch ME7.2',  cap: 3.5 },
    { silnik: '540i 4.4',  km: 286, nm: 440, ecu: 'Bosch ME7.2',  cap: 4.4 },
    { silnik: '520d 2.0',  km: 136, nm: 280, ecu: 'Bosch EDC15C', cap: 2.0 },
    { silnik: '525d 2.5',  km: 163, nm: 350, ecu: 'Bosch EDC15M', cap: 2.5 },
    { silnik: '530d 3.0',  km: 193, nm: 410, ecu: 'Bosch EDC15M', cap: 3.0 },
  ],
  bmw_seria_5_e60: [
    { silnik: '520i 2.0',  km: 170, nm: 210, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: '523i 2.5',  km: 177, nm: 230, ecu: 'Bosch MSV70',      cap: 2.5 },
    { silnik: '525i 2.5',  km: 218, nm: 250, ecu: 'Bosch MSV70',      cap: 2.5 },
    { silnik: '525i 3.0',  km: 218, nm: 270, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '528i 3.0',  km: 234, nm: 280, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '530i 3.0',  km: 272, nm: 315, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: '540i 4.0',  km: 306, nm: 390, ecu: 'Bosch ME9.2',      cap: 4.0 },
    { silnik: '545i 4.4',  km: 333, nm: 450, ecu: 'Bosch ME9.2',      cap: 4.4 },
    { silnik: '550i 4.8',  km: 367, nm: 490, ecu: 'Bosch ME9.2',      cap: 4.8 },
    { silnik: '520d 2.0',  km: 163, nm: 340, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: '525d 2.5',  km: 177, nm: 400, ecu: 'Bosch EDC16C',     cap: 2.5 },
    { silnik: '525d 3.0',  km: 197, nm: 400, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '530d 3.0',  km: 235, nm: 500, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '535d 3.0',  km: 286, nm: 580, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_5_f10: [
    { silnik: '520i 2.0',  km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '523i 2.5',  km: 204, nm: 250, ecu: 'Bosch MEVD17.2.6', cap: 2.5 },
    { silnik: '528i 2.0',  km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: '528i 3.0',  km: 258, nm: 310, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '535i 3.0',  km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '550i 4.4',  km: 449, nm: 650, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: '518d 2.0',  km: 143, nm: 360, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '520d 2.0',  km: 184, nm: 380, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '525d 2.0',  km: 218, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: '525d 3.0',  km: 204, nm: 450, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '530d 3.0',  km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '535d 3.0',  km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '550d 3.0',  km: 381, nm: 740, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_5_g30: [
    { silnik: '520i 2.0',         km: 184, nm: 290, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '530i 2.0',         km: 252, nm: 350, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '540i xDrive 3.0',  km: 340, nm: 450, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M550i xDrive 4.4', km: 462, nm: 650, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: '518d 2.0',         km: 150, nm: 360, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '520d 2.0',         km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '525d 2.0',         km: 231, nm: 500, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '530d xDrive 3.0',  km: 286, nm: 620, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '540d xDrive 3.0',  km: 340, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_5_g60: [
    { silnik: '520i 2.0',        km: 208, nm: 330, ecu: 'Bosch MG1CS024', cap: 2.0 },
    { silnik: '530e xDrive 2.0', km: 299, nm: 450, ecu: 'Bosch MG1CS024', cap: 2.0 },
    { silnik: 'M550i xDrive 4.4',km: 489, nm: 700, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: '520d 2.0',        km: 197, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '540d xDrive 3.0', km: 299, nm: 670, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_6_e63: [
    { silnik: '630i 3.0',  km: 258, nm: 300, ecu: 'Bosch MSV80',     cap: 3.0 },
    { silnik: '645i 4.4',  km: 333, nm: 450, ecu: 'Bosch ME9.2',     cap: 4.4 },
    { silnik: '650i 4.8',  km: 367, nm: 490, ecu: 'Bosch ME9.2',     cap: 4.8 },
    { silnik: '635d 3.0',  km: 286, nm: 580, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_6_f12: [
    { silnik: '640i 3.0',  km: 320, nm: 450, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '650i 4.4',  km: 449, nm: 650, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: '640d 3.0',  km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_6_g32: [
    { silnik: '630i GT 2.0',         km: 258, nm: 400, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '640i xDrive GT 3.0',  km: 340, nm: 450, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: '620d GT 2.0',         km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '630d xDrive GT 3.0',  km: 265, nm: 620, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '640d xDrive GT 3.0',  km: 320, nm: 680, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_7_e65: [
    { silnik: '730i 3.0',  km: 231, nm: 300, ecu: 'Bosch MSV80',     cap: 3.0 },
    { silnik: '735i 3.6',  km: 272, nm: 360, ecu: 'Bosch ME9.2',     cap: 3.6 },
    { silnik: '740i 4.0',  km: 306, nm: 390, ecu: 'Bosch ME9.2',     cap: 4.0 },
    { silnik: '745i 4.4',  km: 333, nm: 450, ecu: 'Bosch ME9.2',     cap: 4.4 },
    { silnik: '750i 4.8',  km: 367, nm: 490, ecu: 'Bosch ME9.2',     cap: 4.8 },
    { silnik: '760i 6.0 V12', km: 445, nm: 600, ecu: 'Bosch ME9.2',  cap: 6.0 },
    { silnik: '730d 3.0',  km: 231, nm: 520, ecu: 'Bosch EDC16CP35', cap: 3.0 },
    { silnik: '740d 4.0',  km: 258, nm: 600, ecu: 'Bosch EDC16CP35', cap: 4.0 },
  ],
  bmw_seria_7_f01: [
    { silnik: '730i 3.0',  km: 258, nm: 310, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '740i 3.0',  km: 320, nm: 450, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: '750i 4.4',  km: 449, nm: 650, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: '760i 6.0 V12', km: 544, nm: 750, ecu: 'Bosch MED17.2.2', cap: 6.0 },
    { silnik: '730d 3.0',  km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '740d 3.0',  km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: '750d 3.0',  km: 381, nm: 740, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_seria_7_g11: [
    { silnik: '730i 2.0',         km: 265, nm: 400, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: '740i xDrive 3.0',  km: 340, nm: 450, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: '750i xDrive 4.4',  km: 462, nm: 650, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: '760i xDrive 6.6 V12', km: 610, nm: 800, ecu: 'Bosch MED17.2.2', cap: 6.6 },
    { silnik: '725d 2.0',         km: 231, nm: 450, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: '730d xDrive 3.0',  km: 286, nm: 620, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '740d xDrive 3.0',  km: 340, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '750d xDrive 3.0',  km: 400, nm: 760, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_7_g70: [
    { silnik: '735i 3.0',         km: 286, nm: 425, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: '740i xDrive 3.0',  km: 381, nm: 540, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: '750e xDrive 3.0',  km: 489, nm: 700, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: '740d xDrive 3.0',  km: 299, nm: 670, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_seria_8_g14: [
    { silnik: '840i 3.0',         km: 340, nm: 500, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: '840i xDrive 3.0',  km: 340, nm: 500, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'M850i xDrive 4.4', km: 530, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: '840d xDrive 3.0',  km: 320, nm: 680, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_x1_e84: [
    { silnik: 'sDrive 18i 2.0', km: 150, nm: 200, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: 'xDrive 20i 2.0', km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 25i 3.0', km: 218, nm: 270, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: 'xDrive 28i 2.0', km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'sDrive 18d 2.0', km: 143, nm: 320, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: 'xDrive 20d 2.0', km: 177, nm: 350, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: 'xDrive 23d 2.0', km: 204, nm: 400, ecu: 'Bosch EDC17C41',   cap: 2.0 },
    { silnik: 'xDrive 25d 2.0', km: 218, nm: 450, ecu: 'Bosch EDC17C41',   cap: 2.0 },
  ],
  bmw_x1_f48: [
    { silnik: 'sDrive 18i 1.5', km: 140, nm: 220, ecu: 'Bosch MG1CS003',   cap: 1.5 },
    { silnik: 'xDrive 20i 2.0', km: 192, nm: 280, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 25i 2.0', km: 231, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'sDrive 16d 1.5', km: 116, nm: 270, ecu: 'Bosch EDC17C50',   cap: 1.5 },
    { silnik: 'sDrive 18d 2.0', km: 150, nm: 330, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 20d 2.0', km: 190, nm: 400, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 25d 2.0', km: 231, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
  ],
  bmw_x1_u11: [
    { silnik: 'sDrive 20i 1.5',         km: 170, nm: 280, ecu: 'Bosch MG1CS024', cap: 1.5 },
    { silnik: 'xDrive 23i 2.0',         km: 218, nm: 360, ecu: 'Bosch MG1CS024', cap: 2.0 },
    { silnik: 'M35i xDrive 2.0',        km: 300, nm: 400, ecu: 'Bosch MG1CS024', cap: 2.0 },
    { silnik: 'sDrive 18d 2.0',         km: 150, nm: 360, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: 'xDrive 23d 2.0',         km: 211, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
  ],
  bmw_x2_f39: [
    { silnik: 'sDrive 18i 1.5',  km: 140, nm: 220, ecu: 'Bosch MG1CS003',   cap: 1.5 },
    { silnik: 'sDrive 20i 2.0',  km: 192, nm: 280, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 25i 2.0',  km: 231, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'M35i xDrive 2.0', km: 306, nm: 450, ecu: 'Bosch MG1CS003',   cap: 2.0 },
    { silnik: 'sDrive 16d 1.5',  km: 116, nm: 270, ecu: 'Bosch EDC17C50',   cap: 1.5 },
    { silnik: 'sDrive 18d 2.0',  km: 150, nm: 330, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 20d 2.0',  km: 190, nm: 400, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 25d 2.0',  km: 231, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
  ],
  bmw_x3_e83: [
    { silnik: '2.0i', km: 150, nm: 200, ecu: 'Bosch MEV9',       cap: 2.0 },
    { silnik: '2.5i', km: 192, nm: 245, ecu: 'Bosch MS43',       cap: 2.5 },
    { silnik: '3.0i', km: 231, nm: 300, ecu: 'Bosch MS43',       cap: 3.0 },
    { silnik: 'xDrive 30si 3.0', km: 272, nm: 315, ecu: 'Bosch MSV80', cap: 3.0 },
    { silnik: 'xDrive 35i 3.0',  km: 306, nm: 400, ecu: 'Bosch MSD80', cap: 3.0 },
    { silnik: '2.0d',  km: 150, nm: 330, ecu: 'Bosch EDC16C',     cap: 2.0 },
    { silnik: '3.0d',  km: 218, nm: 500, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 35d 3.0', km: 286, nm: 580, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_x3_f25: [
    { silnik: 'xDrive 20i 2.0', km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 28i 2.0', km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 35i 3.0', km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'M40i 3.0',       km: 360, nm: 500, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: 'sDrive 18d 2.0', km: 143, nm: 360, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 20d 2.0', km: 190, nm: 400, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 30d 3.0', km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 35d 3.0', km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x3_g01: [
    { silnik: 'xDrive 20i 2.0', km: 184, nm: 290, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'xDrive 30i 2.0', km: 252, nm: 350, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'M40i 3.0',       km: 360, nm: 500, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'sDrive 18d 2.0', km: 150, nm: 360, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: 'xDrive 20d 2.0', km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: 'xDrive 30d 3.0', km: 286, nm: 620, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: 'M40d 3.0',       km: 340, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_x4_f26: [
    { silnik: 'xDrive 20i 2.0', km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 28i 2.0', km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 35i 3.0', km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'M40i 3.0',       km: 360, nm: 465, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: 'xDrive 20d 2.0', km: 190, nm: 400, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 30d 3.0', km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 35d 3.0', km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x4_g02: [
    { silnik: 'xDrive 20i 2.0', km: 184, nm: 290, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'xDrive 30i 2.0', km: 252, nm: 350, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'M40i 3.0',       km: 360, nm: 500, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'xDrive 20d 2.0', km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: 'xDrive 30d 3.0', km: 286, nm: 620, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: 'M40d 3.0',       km: 340, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  bmw_x5_e70: [
    { silnik: 'xDrive 30i 3.0', km: 272, nm: 315, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: 'xDrive 35i 3.0', km: 306, nm: 400, ecu: 'Bosch MSD80',      cap: 3.0 },
    { silnik: 'xDrive 48i 4.8', km: 355, nm: 475, ecu: 'Bosch ME9.2',      cap: 4.8 },
    { silnik: 'xDrive 50i 4.4', km: 408, nm: 600, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'xDrive 30d 3.0', km: 235, nm: 540, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 35d 3.0', km: 286, nm: 580, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 306, nm: 600, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 381, nm: 740, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x5_f15: [
    { silnik: 'xDrive 35i 3.0', km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'xDrive 40e 2.0', km: 313, nm: 450, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'xDrive 50i 4.4', km: 449, nm: 650, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'sDrive 25d 2.0', km: 218, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 25d 2.0', km: 231, nm: 450, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 30d 3.0', km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 381, nm: 740, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x5_g05: [
    { silnik: 'xDrive 40i 3.0', km: 340, nm: 450, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: 'xDrive 45e 3.0', km: 394, nm: 600, ecu: 'Bosch MG1CS024',   cap: 3.0 },
    { silnik: 'M50i 4.4',       km: 530, nm: 750, ecu: 'Bosch MG1CS024',   cap: 4.4 },
    { silnik: 'xDrive 25d 2.0', km: 231, nm: 500, ecu: 'Bosch EDC17C50',   cap: 2.0 },
    { silnik: 'xDrive 30d 3.0', km: 286, nm: 650, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 340, nm: 700, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 400, nm: 760, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x6_e71: [
    { silnik: 'xDrive 35i 3.0', km: 306, nm: 400, ecu: 'Bosch MSD80',      cap: 3.0 },
    { silnik: 'xDrive 50i 4.4', km: 408, nm: 600, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'xDrive 30d 3.0', km: 235, nm: 540, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 35d 3.0', km: 286, nm: 580, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 306, nm: 600, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 381, nm: 740, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x6_f16: [
    { silnik: 'xDrive 35i 3.0', km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'xDrive 50i 4.4', km: 449, nm: 650, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'xDrive 30d 3.0', km: 258, nm: 560, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 313, nm: 630, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 381, nm: 740, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x6_g06: [
    { silnik: 'xDrive 40i 3.0', km: 340, nm: 450, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: 'M50i 4.4',       km: 530, nm: 750, ecu: 'Bosch MG1CS024',   cap: 4.4 },
    { silnik: 'xDrive 30d 3.0', km: 286, nm: 650, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 340, nm: 700, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 400, nm: 760, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_x7_g07: [
    { silnik: 'xDrive 40i 3.0', km: 340, nm: 450, ecu: 'Bosch MG1CS003',   cap: 3.0 },
    { silnik: 'M50i 4.4',       km: 530, nm: 750, ecu: 'Bosch MG1CS024',   cap: 4.4 },
    { silnik: 'M60i 4.4',       km: 530, nm: 750, ecu: 'Bosch MG1CS024',   cap: 4.4 },
    { silnik: 'xDrive 30d 3.0', km: 286, nm: 650, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'xDrive 40d 3.0', km: 340, nm: 700, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
    { silnik: 'M50d 3.0',       km: 400, nm: 760, ecu: 'Bosch EDC17CP09',  cap: 3.0 },
  ],
  bmw_z4_e89: [
    { silnik: 'sDrive 18i 2.0',  km: 156, nm: 240, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'sDrive 20i 2.0',  km: 184, nm: 270, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'sDrive 23i 2.5',  km: 204, nm: 250, ecu: 'Bosch MSV80',      cap: 2.5 },
    { silnik: 'sDrive 28i 2.0',  km: 245, nm: 350, ecu: 'Bosch MEVD17.2.5', cap: 2.0 },
    { silnik: 'sDrive 30i 3.0',  km: 258, nm: 310, ecu: 'Bosch MSV80',      cap: 3.0 },
    { silnik: 'sDrive 35i 3.0',  km: 306, nm: 400, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
    { silnik: 'sDrive 35is 3.0', km: 340, nm: 500, ecu: 'Bosch MEVD17.2.6', cap: 3.0 },
  ],
  bmw_z4_g29: [
    { silnik: 'sDrive 20i 2.0', km: 197, nm: 320, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'sDrive 30i 2.0', km: 258, nm: 400, ecu: 'Bosch MG1CS003', cap: 2.0 },
    { silnik: 'M40i 3.0',       km: 340, nm: 500, ecu: 'Bosch MG1CS003', cap: 3.0 },
  ],

  // Dedykowane modele M (M2/M3/M4/M5/M6/M8 + X3 M / X4 M / X5 M / X6 M).
  // Silniki S55 (3.0 R6 BiTurbo) i S58 (nowsze 3.0 R6 BiTurbo) oraz S63 (4.4 V8 TT).
  bmw_m2_f87: [
    { silnik: 'M2 3.0 BiTurbo',             km: 370, nm: 465, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M2 Competition 3.0 BiTurbo', km: 410, nm: 550, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M2 CS 3.0 BiTurbo',          km: 450, nm: 550, ecu: 'Bosch MG1CS003', cap: 3.0 },
  ],
  bmw_m2_g87: [
    { silnik: 'M2 3.0 BiTurbo S58', km: 460, nm: 550, ecu: 'Bosch MG1CS024', cap: 3.0 },
  ],
  bmw_m3_e46: [
    { silnik: 'M3 3.2 S54', km: 343, nm: 365, ecu: 'Siemens MSS54', cap: 3.2 },
    { silnik: 'M3 CSL 3.2 S54', km: 360, nm: 370, ecu: 'Siemens MSS54', cap: 3.2 },
  ],
  bmw_m3_e90: [
    { silnik: 'M3 4.0 V8 S65', km: 420, nm: 400, ecu: 'Siemens MSS60', cap: 4.0 },
    { silnik: 'M3 GTS 4.4 V8 S65', km: 450, nm: 440, ecu: 'Siemens MSS60', cap: 4.4 },
  ],
  bmw_m3_f80: [
    { silnik: 'M3 3.0 BiTurbo S55', km: 431, nm: 550, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M3 Competition 3.0 BiTurbo', km: 450, nm: 550, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M3 CS 3.0 BiTurbo', km: 460, nm: 600, ecu: 'Bosch MG1CS003', cap: 3.0 },
  ],
  bmw_m3_g80: [
    { silnik: 'M3 3.0 BiTurbo S58', km: 480, nm: 550, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'M3 Competition 3.0 BiTurbo', km: 510, nm: 650, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'M3 CS 3.0 BiTurbo', km: 550, nm: 650, ecu: 'Bosch MG1CS024', cap: 3.0 },
  ],
  bmw_m4_f82: [
    { silnik: 'M4 3.0 BiTurbo S55', km: 431, nm: 550, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M4 Competition 3.0 BiTurbo', km: 450, nm: 550, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M4 CS 3.0 BiTurbo', km: 460, nm: 600, ecu: 'Bosch MG1CS003', cap: 3.0 },
    { silnik: 'M4 GTS 3.0 BiTurbo', km: 500, nm: 600, ecu: 'Bosch MG1CS003', cap: 3.0 },
  ],
  bmw_m4_g82: [
    { silnik: 'M4 3.0 BiTurbo S58', km: 480, nm: 550, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'M4 Competition 3.0 BiTurbo', km: 510, nm: 650, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'M4 CSL 3.0 BiTurbo', km: 550, nm: 650, ecu: 'Bosch MG1CS024', cap: 3.0 },
  ],
  bmw_m5_e39: [
    { silnik: 'M5 5.0 V8 S62', km: 400, nm: 500, ecu: 'Siemens MSS52', cap: 5.0 },
  ],
  bmw_m5_e60: [
    { silnik: 'M5 5.0 V10 S85', km: 507, nm: 520, ecu: 'Siemens MSS65', cap: 5.0 },
  ],
  bmw_m5_f10: [
    { silnik: 'M5 4.4 V8 S63', km: 560, nm: 680, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'M5 Competition 4.4 V8', km: 575, nm: 680, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'M5 30 Jahre 4.4 V8', km: 600, nm: 700, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
  ],
  bmw_m5_f90: [
    { silnik: 'M5 4.4 V8 S63', km: 600, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: 'M5 Competition 4.4 V8', km: 625, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: 'M5 CS 4.4 V8', km: 635, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
  ],
  bmw_m5_g90: [
    { silnik: 'M5 4.4 V8 PHEV', km: 727, nm: 1000, ecu: 'Bosch MG1CS024', cap: 4.4 },
  ],
  bmw_m6_f12: [
    { silnik: 'M6 4.4 V8 S63', km: 560, nm: 680, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
    { silnik: 'M6 Competition 4.4 V8', km: 600, nm: 700, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
  ],
  bmw_m8_f91: [
    { silnik: 'M8 4.4 V8 S63', km: 600, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: 'M8 Competition 4.4 V8', km: 625, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
  ],
  bmw_x3m_f97: [
    { silnik: 'X3 M 3.0 BiTurbo S58', km: 480, nm: 600, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'X3 M Competition 3.0 BiTurbo', km: 510, nm: 650, ecu: 'Bosch MG1CS024', cap: 3.0 },
  ],
  bmw_x4m_f98: [
    { silnik: 'X4 M 3.0 BiTurbo S58', km: 480, nm: 600, ecu: 'Bosch MG1CS024', cap: 3.0 },
    { silnik: 'X4 M Competition 3.0 BiTurbo', km: 510, nm: 650, ecu: 'Bosch MG1CS024', cap: 3.0 },
  ],
  bmw_x5m_e70: [
    { silnik: 'X5 M 4.4 V8 S63', km: 555, nm: 680, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
  ],
  bmw_x5m_f85: [
    { silnik: 'X5 M 4.4 V8 S63', km: 575, nm: 750, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
  ],
  bmw_x5m_f95: [
    { silnik: 'X5 M 4.4 V8 S63', km: 600, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: 'X5 M Competition 4.4 V8', km: 625, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
  ],
  bmw_x6m_e71: [
    { silnik: 'X6 M 4.4 V8 S63', km: 555, nm: 680, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
  ],
  bmw_x6m_f86: [
    { silnik: 'X6 M 4.4 V8 S63', km: 575, nm: 750, ecu: 'Bosch MEVD17.2.G', cap: 4.4 },
  ],
  bmw_x6m_f96: [
    { silnik: 'X6 M 4.4 V8 S63', km: 600, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
    { silnik: 'X6 M Competition 4.4 V8', km: 625, nm: 750, ecu: 'Bosch MG1CS024', cap: 4.4 },
  ],

  // Stare puste pulpity (zachowane dla kompatybilności wstecznej z modelami,
  // które jeszcze ich używają w innych markach). NIE są używane przez BMW.
  bmw_diesel: [],
  bmw_petrol_turbo: [],
  bmw_petrol_na: [],

  // ---------- Mercedes-Benz ----------
  mb_diesel: [
    { silnik: 'A 180 CDI 1.5', km: 109, nm: 260, ecu: 'Bosch EDC17C66', cap: 1.5 },
    { silnik: 'A 200 CDI 2.1', km: 136, nm: 300, ecu: 'Bosch EDC17CP46', cap: 2.1 },
    { silnik: 'A 220 CDI 2.1', km: 170, nm: 350, ecu: 'Bosch EDC17CP46', cap: 2.1 },
    { silnik: 'C 200 CDI 2.1', km: 136, nm: 360, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'C 220 CDI 2.1', km: 170, nm: 400, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'C 250 CDI 2.1', km: 204, nm: 500, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'C 220 d 2.0',   km: 194, nm: 400, ecu: 'Bosch EDC17CP57', cap: 2.0 },
    { silnik: 'C 300 d 2.0',   km: 245, nm: 500, ecu: 'Bosch EDC17CP57', cap: 2.0 },
    { silnik: 'E 200 CDI 2.1', km: 136, nm: 360, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'E 220 CDI 2.1', km: 170, nm: 400, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'E 250 CDI 2.1', km: 204, nm: 500, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'E 350 CDI 3.0', km: 265, nm: 620, ecu: 'Bosch EDC17CP10', cap: 3.0 },
    { silnik: 'E 400 d 3.0',   km: 340, nm: 700, ecu: 'Bosch EDC17CP57', cap: 3.0 },
    { silnik: 'S 350 CDI 3.0', km: 258, nm: 620, ecu: 'Bosch EDC17CP10', cap: 3.0 },
    { silnik: 'GLA 200 CDI 2.1', km: 136, nm: 300, ecu: 'Bosch EDC17CP46', cap: 2.1 },
    { silnik: 'GLA 220 CDI 2.1', km: 170, nm: 350, ecu: 'Bosch EDC17CP46', cap: 2.1 },
    { silnik: 'GLC 220 d 2.1', km: 170, nm: 400, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'GLC 250 d 2.1', km: 204, nm: 500, ecu: 'Delphi DCM3.5',  cap: 2.1 },
    { silnik: 'GLE 350 d 3.0', km: 258, nm: 620, ecu: 'Bosch EDC17CP10', cap: 3.0 },
    { silnik: 'ML 350 CDI 3.0', km: 224, nm: 540, ecu: 'Bosch EDC17CP10', cap: 3.0 },
    { silnik: 'Sprinter 313 CDI 2.1', km: 129, nm: 305, ecu: 'Bosch EDC17CP46', cap: 2.1 },
    { silnik: 'Sprinter 316 CDI 2.1', km: 163, nm: 360, ecu: 'Bosch EDC17CP46', cap: 2.1 },
    { silnik: 'Vito 110 CDI 1.6', km: 102, nm: 270, ecu: 'Delphi DCM3.7',  cap: 1.6 },
    { silnik: 'Vito 116 CDI 2.1', km: 163, nm: 380, ecu: 'Delphi DCM3.5',  cap: 2.1 },
  ],
  mb_petrol_turbo: [
    { silnik: 'A 200 1.3',   km: 163, nm: 250, ecu: 'Bosch MED17.7.7', cap: 1.3 },
    { silnik: 'A 250 2.0',   km: 224, nm: 350, ecu: 'Bosch MED17.7.7', cap: 2.0 },
    { silnik: 'C 180 1.6',   km: 156, nm: 250, ecu: 'Delphi MT05.x',   cap: 1.6 },
    { silnik: 'C 200 1.6',   km: 184, nm: 300, ecu: 'Delphi MT05.x',   cap: 1.6 },
    { silnik: 'C 250 2.0',   km: 211, nm: 350, ecu: 'Delphi MT05.x',   cap: 2.0 },
    { silnik: 'C 300 2.0',   km: 245, nm: 370, ecu: 'Bosch MED17.7.5', cap: 2.0 },
    { silnik: 'E 200 2.0',   km: 184, nm: 300, ecu: 'Bosch MED17.7.5', cap: 2.0 },
    { silnik: 'E 250 2.0',   km: 211, nm: 350, ecu: 'Bosch MED17.7.5', cap: 2.0 },
    { silnik: 'E 300 2.0',   km: 245, nm: 370, ecu: 'Bosch MED17.7.5', cap: 2.0 },
    { silnik: 'E 400 3.0',   km: 333, nm: 480, ecu: 'Bosch MED17.7.3', cap: 3.0 },
    { silnik: 'GLA 250 2.0', km: 211, nm: 350, ecu: 'Bosch MED17.7.7', cap: 2.0 },
    { silnik: 'GLC 300 2.0', km: 245, nm: 370, ecu: 'Bosch MED17.7.5', cap: 2.0 },
    { silnik: 'GLE 450 3.0', km: 367, nm: 500, ecu: 'Bosch MED17.7.3', cap: 3.0 },
    { silnik: 'AMG A35 2.0', km: 306, nm: 400, ecu: 'Bosch MED17.7.7', cap: 2.0 },
    { silnik: 'AMG C43 3.0', km: 390, nm: 520, ecu: 'Bosch MED17.7.3', cap: 3.0 },
    { silnik: 'AMG E63 4.0', km: 571, nm: 750, ecu: 'Bosch MED17.7.3', cap: 4.0 },
  ],
  mb_petrol_na: [
    { silnik: 'A 160 1.6',  km: 102, nm: 150, ecu: 'Siemens MS43',   cap: 1.6 },
    { silnik: 'C 200 K 1.8',km: 163, nm: 240, ecu: 'Bosch ME9.7',    cap: 1.8 },
    { silnik: 'E 350 3.5',  km: 272, nm: 350, ecu: 'Bosch ME9.7',    cap: 3.5 },
    { silnik: 'S 500 5.5',  km: 388, nm: 530, ecu: 'Bosch ME9.7',    cap: 5.5 },
  ],

  // ---------- Ford ----------
  ford_diesel: [
    { silnik: '1.5 TDCi 95',  km: 95,  nm: 215, ecu: 'Continental SID208', cap: 1.5 },
    { silnik: '1.5 TDCi 120', km: 120, nm: 270, ecu: 'Continental SID208', cap: 1.5 },
    { silnik: '1.6 TDCi 95',  km: 95,  nm: 220, ecu: 'Continental SID807', cap: 1.6 },
    { silnik: '1.6 TDCi 115', km: 115, nm: 270, ecu: 'Continental SID807', cap: 1.6 },
    { silnik: '2.0 TDCi 115', km: 115, nm: 280, ecu: 'Bosch EDC17CP05',   cap: 2.0 },
    { silnik: '2.0 TDCi 140', km: 140, nm: 320, ecu: 'Bosch EDC17CP05',   cap: 2.0 },
    { silnik: '2.0 TDCi 150', km: 150, nm: 370, ecu: 'Bosch EDC17C70',   cap: 2.0 },
    { silnik: '2.0 TDCi 180', km: 180, nm: 400, ecu: 'Bosch EDC17C70',   cap: 2.0 },
    { silnik: '2.2 TDCi 100', km: 100, nm: 310, ecu: 'Delphi DCM3.5',    cap: 2.2 },
    { silnik: '2.2 TDCi 125', km: 125, nm: 350, ecu: 'Delphi DCM3.5',    cap: 2.2 },
    { silnik: '2.2 TDCi 155', km: 155, nm: 385, ecu: 'Delphi DCM3.5',    cap: 2.2 },
    { silnik: '3.2 TDCi 200', km: 200, nm: 470, ecu: 'Delphi DCM6.2',    cap: 3.2 },
  ],
  ford_petrol_turbo: [
    { silnik: '1.0 EcoBoost 100', km: 100, nm: 170, ecu: 'Bosch MED17.0.7', cap: 1.0 },
    { silnik: '1.0 EcoBoost 125', km: 125, nm: 200, ecu: 'Bosch MED17.0.7', cap: 1.0 },
    { silnik: '1.0 EcoBoost 140', km: 140, nm: 240, ecu: 'Bosch MED17.0.7', cap: 1.0 },
    { silnik: '1.5 EcoBoost 150', km: 150, nm: 240, ecu: 'Bosch MED17.0.7', cap: 1.5 },
    { silnik: '1.5 EcoBoost 182', km: 182, nm: 240, ecu: 'Bosch MED17.0.7', cap: 1.5 },
    { silnik: '1.6 EcoBoost 150', km: 150, nm: 240, ecu: 'Continental MPC560', cap: 1.6 },
    { silnik: '1.6 EcoBoost 182', km: 182, nm: 270, ecu: 'Continental MPC560', cap: 1.6 },
    { silnik: '2.0 EcoBoost 200', km: 200, nm: 300, ecu: 'Continental MPC560', cap: 2.0 },
    { silnik: '2.0 EcoBoost 240', km: 240, nm: 340, ecu: 'Continental MPC560', cap: 2.0 },
    { silnik: '2.3 EcoBoost 280', km: 280, nm: 420, ecu: 'Bosch MED17.0.7',  cap: 2.3 },
    { silnik: '2.3 EcoBoost 350', km: 350, nm: 475, ecu: 'Bosch MED17.0.7',  cap: 2.3 },
  ],
  ford_petrol_na: [
    { silnik: '1.25 Duratec 82',  km: 82,  nm: 114, ecu: 'Visteon EEC-V',  cap: 1.25 },
    { silnik: '1.4 Duratec 96',   km: 96,  nm: 128, ecu: 'Visteon EEC-V',  cap: 1.4 },
    { silnik: '1.6 Duratec 105',  km: 105, nm: 150, ecu: 'Visteon EEC-V',  cap: 1.6 },
    { silnik: '1.6 Ti-VCT 125',   km: 125, nm: 159, ecu: 'Visteon EEC-VI', cap: 1.6 },
    { silnik: '2.0 Duratec 145',  km: 145, nm: 185, ecu: 'Visteon EEC-VI', cap: 2.0 },
  ],

  // ---------- PSA / Stellantis (Peugeot/Citroen/DS/Opel) ----------
  psa_diesel: [
    { silnik: '1.4 HDi 68',   km: 68,  nm: 160, ecu: 'Bosch EDC16C34', cap: 1.4 },
    { silnik: '1.5 BlueHDi 100', km: 100, nm: 250, ecu: 'Continental SID807', cap: 1.5 },
    { silnik: '1.6 HDi 90',   km: 90,  nm: 215, ecu: 'Bosch EDC16C34', cap: 1.6 },
    { silnik: '1.6 HDi 110',  km: 110, nm: 240, ecu: 'Bosch EDC17C10', cap: 1.6 },
    { silnik: '1.6 BlueHDi 100', km: 100, nm: 254, ecu: 'Bosch EDC17C60', cap: 1.6 },
    { silnik: '1.6 BlueHDi 120', km: 120, nm: 300, ecu: 'Bosch EDC17C60', cap: 1.6 },
    { silnik: '2.0 HDi 136',  km: 136, nm: 320, ecu: 'Bosch EDC17C10', cap: 2.0 },
    { silnik: '2.0 HDi 150',  km: 150, nm: 340, ecu: 'Bosch EDC17C10', cap: 2.0 },
    { silnik: '2.0 BlueHDi 150', km: 150, nm: 370, ecu: 'Bosch EDC17C60', cap: 2.0 },
    { silnik: '2.0 BlueHDi 180', km: 180, nm: 400, ecu: 'Bosch EDC17C60', cap: 2.0 },
    { silnik: '2.2 HDi 170',  km: 170, nm: 370, ecu: 'Delphi DCM3.5',  cap: 2.2 },
    { silnik: '2.2 BlueHDi 200', km: 200, nm: 450, ecu: 'Delphi DCM6.2', cap: 2.2 },
    { silnik: '3.0 HDi 240',  km: 240, nm: 450, ecu: 'Bosch EDC17CP10', cap: 3.0 },
  ],
  psa_petrol_turbo: [
    { silnik: '1.2 PureTech 110', km: 110, nm: 205, ecu: 'Continental MPC5746', cap: 1.2 },
    { silnik: '1.2 PureTech 130', km: 130, nm: 230, ecu: 'Continental MPC5746', cap: 1.2 },
    { silnik: '1.2 PureTech 155', km: 155, nm: 240, ecu: 'Continental MPC5746', cap: 1.2 },
    { silnik: '1.6 THP 150',  km: 150, nm: 240, ecu: 'Bosch MEV17.4',  cap: 1.6 },
    { silnik: '1.6 THP 165',  km: 165, nm: 240, ecu: 'Bosch MEV17.4',  cap: 1.6 },
    { silnik: '1.6 THP 200',  km: 200, nm: 275, ecu: 'Bosch MEV17.4',  cap: 1.6 },
    { silnik: '1.6 THP 270',  km: 270, nm: 330, ecu: 'Bosch MEV17.4',  cap: 1.6 },
  ],
  psa_petrol_na: [
    { silnik: '1.0 VTi 68',   km: 68,  nm: 95,  ecu: 'Bosch ME17.4', cap: 1.0 },
    { silnik: '1.2 VTi 82',   km: 82,  nm: 118, ecu: 'Bosch ME17.4', cap: 1.2 },
    { silnik: '1.4 VTi 95',   km: 95,  nm: 136, ecu: 'Bosch ME17.4', cap: 1.4 },
    { silnik: '1.6 VTi 120',  km: 120, nm: 160, ecu: 'Bosch ME17.4', cap: 1.6 },
  ],

  // ---------- Renault / Dacia ----------
  renault_diesel: [
    { silnik: '1.5 dCi 75',   km: 75,  nm: 200, ecu: 'Delphi DDCR',   cap: 1.5 },
    { silnik: '1.5 dCi 90',   km: 90,  nm: 220, ecu: 'Delphi DCM3.4', cap: 1.5 },
    { silnik: '1.5 dCi 110',  km: 110, nm: 260, ecu: 'Continental SID305', cap: 1.5 },
    { silnik: '1.5 Blue dCi 95',  km: 95,  nm: 240, ecu: 'Continental SID310', cap: 1.5 },
    { silnik: '1.5 Blue dCi 115', km: 115, nm: 260, ecu: 'Continental SID310', cap: 1.5 },
    { silnik: '1.6 dCi 130',  km: 130, nm: 320, ecu: 'Continental SID310', cap: 1.6 },
    { silnik: '2.0 dCi 150',  km: 150, nm: 360, ecu: 'Bosch EDC17C42', cap: 2.0 },
    { silnik: '2.0 dCi 175',  km: 175, nm: 380, ecu: 'Bosch EDC17C42', cap: 2.0 },
    { silnik: '2.3 dCi 145',  km: 145, nm: 350, ecu: 'Continental SID305', cap: 2.3 },
    { silnik: '2.3 dCi 170',  km: 170, nm: 380, ecu: 'Continental SID305', cap: 2.3 },
    { silnik: '2.5 dCi 145',  km: 145, nm: 320, ecu: 'Bosch EDC16',    cap: 2.5 },
  ],
  renault_petrol_turbo: [
    { silnik: '0.9 TCe 90',   km: 90,  nm: 135, ecu: 'Continental EMS3155', cap: 0.9 },
    { silnik: '1.0 TCe 100',  km: 100, nm: 160, ecu: 'Continental EMS3160', cap: 1.0 },
    { silnik: '1.2 TCe 115',  km: 115, nm: 190, ecu: 'Continental EMS3132', cap: 1.2 },
    { silnik: '1.2 TCe 130',  km: 130, nm: 205, ecu: 'Continental EMS3132', cap: 1.2 },
    { silnik: '1.3 TCe 140',  km: 140, nm: 240, ecu: 'Bosch MED17',         cap: 1.3 },
    { silnik: '1.3 TCe 160',  km: 160, nm: 270, ecu: 'Bosch MED17',         cap: 1.3 },
    { silnik: '1.6 TCe 200',  km: 200, nm: 280, ecu: 'Continental EMS3155', cap: 1.6 },
    { silnik: '1.8 TCe 225',  km: 225, nm: 300, ecu: 'Continental EMS3155', cap: 1.8 },
  ],
  renault_petrol_na: [
    { silnik: '1.2 16V 75',   km: 75,  nm: 107, ecu: 'Siemens EMS31',  cap: 1.2 },
    { silnik: '1.4 16V 95',   km: 95,  nm: 127, ecu: 'Siemens EMS31',  cap: 1.4 },
    { silnik: '1.6 16V 110',  km: 110, nm: 151, ecu: 'Siemens EMS31',  cap: 1.6 },
    { silnik: '2.0 16V 140',  km: 140, nm: 195, ecu: 'Siemens EMS31',  cap: 2.0 },
  ],
  dacia_diesel: [
    { silnik: '1.5 dCi 75',   km: 75,  nm: 200, ecu: 'Delphi DDCR',   cap: 1.5 },
    { silnik: '1.5 dCi 90',   km: 90,  nm: 220, ecu: 'Delphi DCM3.4', cap: 1.5 },
    { silnik: '1.5 Blue dCi 95',  km: 95,  nm: 240, ecu: 'Continental SID310', cap: 1.5 },
    { silnik: '1.5 Blue dCi 115', km: 115, nm: 260, ecu: 'Continental SID310', cap: 1.5 },
  ],
  dacia_petrol_turbo: [
    { silnik: '0.9 TCe 90',   km: 90,  nm: 135, ecu: 'Continental EMS3155', cap: 0.9 },
    { silnik: '1.0 TCe 90',   km: 90,  nm: 160, ecu: 'Continental EMS3160', cap: 1.0 },
    { silnik: '1.0 TCe 100 LPG', km: 100, nm: 170, ecu: 'Continental EMS3160', cap: 1.0 },
    { silnik: '1.3 TCe 130',  km: 130, nm: 240, ecu: 'Bosch MED17',         cap: 1.3 },
    { silnik: '1.3 TCe 150',  km: 150, nm: 250, ecu: 'Bosch MED17',         cap: 1.3 },
  ],
  dacia_petrol_na: [
    { silnik: '1.0 SCe 65',   km: 65,  nm: 95,  ecu: 'Continental EMS3160', cap: 1.0 },
    { silnik: '1.0 SCe 75',   km: 75,  nm: 95,  ecu: 'Continental EMS3160', cap: 1.0 },
    { silnik: '1.6 SCe 110',  km: 110, nm: 156, ecu: 'Siemens EMS31',  cap: 1.6 },
  ],

  // ---------- Fiat / Alfa Romeo / Lancia / Jeep / Chrysler / Dodge ----------
  fiat_diesel: [
    { silnik: '1.3 MultiJet 75',  km: 75,  nm: 190, ecu: 'Bosch EDC16C39', cap: 1.3 },
    { silnik: '1.3 MultiJet 90',  km: 90,  nm: 200, ecu: 'Bosch EDC16C39', cap: 1.3 },
    { silnik: '1.3 MultiJet 95',  km: 95,  nm: 200, ecu: 'Bosch EDC17C49', cap: 1.3 },
    { silnik: '1.6 MultiJet 105', km: 105, nm: 320, ecu: 'Bosch EDC17C49', cap: 1.6 },
    { silnik: '1.6 MultiJet 120', km: 120, nm: 320, ecu: 'Bosch EDC17C69', cap: 1.6 },
    { silnik: '1.9 JTD 100',  km: 100, nm: 200, ecu: 'Marelli 6JF',    cap: 1.9 },
    { silnik: '1.9 JTD 120',  km: 120, nm: 280, ecu: 'Marelli 6JF',    cap: 1.9 },
    { silnik: '1.9 JTD 150',  km: 150, nm: 305, ecu: 'Marelli 6JF',    cap: 1.9 },
    { silnik: '2.0 MultiJet 135', km: 135, nm: 320, ecu: 'Bosch EDC17C49', cap: 2.0 },
    { silnik: '2.0 MultiJet 165', km: 165, nm: 360, ecu: 'Bosch EDC17C69', cap: 2.0 },
    { silnik: '2.3 MultiJet 130', km: 130, nm: 320, ecu: 'Bosch EDC16C39', cap: 2.3 },
    { silnik: '2.3 MultiJet 160', km: 160, nm: 380, ecu: 'Bosch EDC17C49', cap: 2.3 },
    { silnik: '3.0 MultiJet 180', km: 180, nm: 400, ecu: 'Bosch EDC17CP52', cap: 3.0 },
  ],
  fiat_petrol_turbo: [
    { silnik: '0.9 TwinAir 85',  km: 85,  nm: 145, ecu: 'Marelli 8GMK', cap: 0.9 },
    { silnik: '0.9 TwinAir 105', km: 105, nm: 145, ecu: 'Marelli 8GMK', cap: 0.9 },
    { silnik: '1.4 T-Jet 120',   km: 120, nm: 206, ecu: 'Marelli 8F2', cap: 1.4 },
    { silnik: '1.4 T-Jet 150',   km: 150, nm: 230, ecu: 'Marelli 8F2', cap: 1.4 },
    { silnik: '1.4 MultiAir 170',km: 170, nm: 250, ecu: 'Marelli 8F3', cap: 1.4 },
  ],
  fiat_petrol_na: [
    { silnik: '1.2 8V 69',   km: 69, nm: 102, ecu: 'Marelli IAW 5SF',  cap: 1.2 },
    { silnik: '1.4 8V 77',   km: 77, nm: 115, ecu: 'Marelli IAW 5SF',  cap: 1.4 },
    { silnik: '1.4 16V 95',  km: 95, nm: 127, ecu: 'Marelli IAW 5SF',  cap: 1.4 },
  ],
  alfa_diesel: [
    { silnik: '1.6 JTDM 105', km: 105, nm: 320, ecu: 'Bosch EDC17C49', cap: 1.6 },
    { silnik: '1.6 JTDM 120', km: 120, nm: 320, ecu: 'Bosch EDC17C69', cap: 1.6 },
    { silnik: '2.0 JTDM 150', km: 150, nm: 380, ecu: 'Bosch EDC17C49', cap: 2.0 },
    { silnik: '2.0 JTDM 170', km: 170, nm: 380, ecu: 'Bosch EDC17C49', cap: 2.0 },
    { silnik: '2.0 JTDM 180', km: 180, nm: 400, ecu: 'Bosch EDC17C69', cap: 2.0 },
    { silnik: '2.0 JTDM 210', km: 210, nm: 470, ecu: 'Bosch EDC17C69', cap: 2.0 },
    { silnik: '2.2 JTDM 150', km: 150, nm: 380, ecu: 'Bosch EDC17C69', cap: 2.2 },
    { silnik: '2.2 JTDM 180', km: 180, nm: 450, ecu: 'Bosch EDC17C69', cap: 2.2 },
    { silnik: '2.2 JTDM 210', km: 210, nm: 470, ecu: 'Bosch EDC17C69', cap: 2.2 },
  ],
  alfa_petrol_turbo: [
    { silnik: '1.4 TB 170',  km: 170, nm: 230, ecu: 'Marelli 8F2', cap: 1.4 },
    { silnik: '1.75 TBi 200',km: 200, nm: 320, ecu: 'Bosch ME17',  cap: 1.75 },
    { silnik: '2.0 T 280',   km: 280, nm: 400, ecu: 'Bosch MED17.3.5', cap: 2.0 },
    { silnik: '2.9 V6 510',  km: 510, nm: 600, ecu: 'Bosch MED17.3.5', cap: 2.9 },
  ],
  lancia_diesel: [
    { silnik: '1.3 MultiJet 75', km: 75, nm: 190, ecu: 'Bosch EDC16C39', cap: 1.3 },
    { silnik: '1.3 MultiJet 90', km: 90, nm: 200, ecu: 'Bosch EDC16C39', cap: 1.3 },
    { silnik: '1.6 MultiJet 120', km: 120, nm: 300, ecu: 'Bosch EDC17C49', cap: 1.6 },
  ],
  lancia_petrol_na: [
    { silnik: '1.2 8V 69', km: 69, nm: 102, ecu: 'Marelli IAW 5SF', cap: 1.2 },
    { silnik: '1.4 16V 95', km: 95, nm: 127, ecu: 'Marelli IAW 5SF', cap: 1.4 },
  ],
  jeep_diesel: [
    { silnik: '1.6 MultiJet 120', km: 120, nm: 320, ecu: 'Bosch EDC17C69', cap: 1.6 },
    { silnik: '2.0 MultiJet 140', km: 140, nm: 350, ecu: 'Bosch EDC17C69', cap: 2.0 },
    { silnik: '2.0 MultiJet 170', km: 170, nm: 380, ecu: 'Bosch EDC17C69', cap: 2.0 },
    { silnik: '2.2 MultiJet 200', km: 200, nm: 450, ecu: 'Delphi DCM6.2',  cap: 2.2 },
    { silnik: '3.0 CRD 241',  km: 241, nm: 550, ecu: 'Bosch EDC17CP52', cap: 3.0 },
    { silnik: '3.0 CRD 250',  km: 250, nm: 570, ecu: 'Bosch EDC17CP52', cap: 3.0 },
  ],
  jeep_petrol_turbo: [
    { silnik: '1.3 GSE 150',  km: 150, nm: 270, ecu: 'Marelli 11F',  cap: 1.3 },
    { silnik: '1.3 GSE 180',  km: 180, nm: 270, ecu: 'Marelli 11F',  cap: 1.3 },
    { silnik: '2.0 GME 272',  km: 272, nm: 400, ecu: 'Bosch MED17.8.5', cap: 2.0 },
  ],
  jeep_petrol_na: [
    { silnik: '2.4 Tigershark 184', km: 184, nm: 237, ecu: 'Marelli 8GMK', cap: 2.4 },
    { silnik: '3.6 Pentastar 286',  km: 286, nm: 347, ecu: 'Continental EMS', cap: 3.6 },
  ],
  chrysler_diesel: [
    { silnik: '2.8 CRD 150',  km: 150, nm: 360, ecu: 'Bosch EDC16',   cap: 2.8 },
    { silnik: '3.0 CRD 218',  km: 218, nm: 510, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  chrysler_petrol_na: [
    { silnik: '3.6 Pentastar 286', km: 286, nm: 347, ecu: 'Continental EMS', cap: 3.6 },
  ],
  dodge_petrol_na: [
    { silnik: '3.6 Pentastar 305', km: 305, nm: 363, ecu: 'Continental EMS', cap: 3.6 },
    { silnik: '5.7 HEMI 372',      km: 372, nm: 542, ecu: 'Continental EMS', cap: 5.7 },
    { silnik: '6.4 HEMI 485',      km: 485, nm: 644, ecu: 'Continental EMS', cap: 6.4 },
  ],
  dodge_petrol_turbo: [
    { silnik: '2.0 GME 272',  km: 272, nm: 400, ecu: 'Bosch MED17.8.5', cap: 2.0 },
    { silnik: '6.2 Hellcat 707', km: 707, nm: 875, ecu: 'Continental EMS', cap: 6.2 },
  ],

  // ---------- Hyundai / Kia ----------
  hyundai_diesel: [
    { silnik: '1.1 CRDi 75',  km: 75,  nm: 180, ecu: 'Continental SID807', cap: 1.1 },
    { silnik: '1.4 CRDi 90',  km: 90,  nm: 240, ecu: 'Bosch EDC17C57', cap: 1.4 },
    { silnik: '1.6 CRDi 110', km: 110, nm: 280, ecu: 'Bosch EDC17C57', cap: 1.6 },
    { silnik: '1.6 CRDi 115', km: 115, nm: 280, ecu: 'Bosch EDC17C57', cap: 1.6 },
    { silnik: '1.6 CRDi 136', km: 136, nm: 320, ecu: 'Bosch EDC17C57', cap: 1.6 },
    { silnik: '1.7 CRDi 116', km: 116, nm: 280, ecu: 'Bosch EDC17C57', cap: 1.7 },
    { silnik: '1.7 CRDi 141', km: 141, nm: 340, ecu: 'Bosch EDC17C57', cap: 1.7 },
    { silnik: '2.0 CRDi 136', km: 136, nm: 320, ecu: 'Bosch EDC17C57', cap: 2.0 },
    { silnik: '2.0 CRDi 184', km: 184, nm: 400, ecu: 'Bosch EDC17C57', cap: 2.0 },
    { silnik: '2.2 CRDi 197', km: 197, nm: 440, ecu: 'Bosch EDC17C57', cap: 2.2 },
    { silnik: '2.5 CRDi 170', km: 170, nm: 392, ecu: 'Bosch EDC17C57', cap: 2.5 },
  ],
  hyundai_petrol_turbo: [
    { silnik: '1.0 T-GDI 100',km: 100, nm: 172, ecu: 'Continental SIM2K-260', cap: 1.0 },
    { silnik: '1.0 T-GDI 120',km: 120, nm: 172, ecu: 'Continental SIM2K-260', cap: 1.0 },
    { silnik: '1.4 T-GDI 140',km: 140, nm: 242, ecu: 'Continental SIM2K-260', cap: 1.4 },
    { silnik: '1.6 T-GDI 177',km: 177, nm: 265, ecu: 'Continental SIM2K-261', cap: 1.6 },
    { silnik: '1.6 T-GDI 198',km: 198, nm: 265, ecu: 'Continental SIM2K-261', cap: 1.6 },
    { silnik: '2.0 T-GDI 250',km: 250, nm: 353, ecu: 'Continental SIM2K-261', cap: 2.0 },
    { silnik: '3.3 T-GDI 370',km: 370, nm: 510, ecu: 'Continental SIM2K-260', cap: 3.3 },
  ],
  hyundai_petrol_na: [
    { silnik: '1.0 MPI 67',  km: 67,  nm: 96,  ecu: 'Bosch ME17.9.21', cap: 1.0 },
    { silnik: '1.2 MPI 75',  km: 75,  nm: 113, ecu: 'Bosch ME17.9.21', cap: 1.2 },
    { silnik: '1.4 MPI 100', km: 100, nm: 134, ecu: 'Bosch ME17.9.11', cap: 1.4 },
    { silnik: '1.6 MPI 124', km: 124, nm: 156, ecu: 'Bosch ME17.9.11', cap: 1.6 },
    { silnik: '2.0 MPI 152', km: 152, nm: 192, ecu: 'Continental SIM2K', cap: 2.0 },
  ],
  kia_diesel: [
    { silnik: '1.4 CRDi 90',  km: 90,  nm: 240, ecu: 'Bosch EDC17C57', cap: 1.4 },
    { silnik: '1.6 CRDi 110', km: 110, nm: 280, ecu: 'Bosch EDC17C57', cap: 1.6 },
    { silnik: '1.6 CRDi 115', km: 115, nm: 280, ecu: 'Bosch EDC17C57', cap: 1.6 },
    { silnik: '1.6 CRDi 136', km: 136, nm: 320, ecu: 'Bosch EDC17C57', cap: 1.6 },
    { silnik: '1.7 CRDi 115', km: 115, nm: 280, ecu: 'Bosch EDC17C57', cap: 1.7 },
    { silnik: '1.7 CRDi 141', km: 141, nm: 340, ecu: 'Bosch EDC17C57', cap: 1.7 },
    { silnik: '2.0 CRDi 136', km: 136, nm: 320, ecu: 'Bosch EDC17C57', cap: 2.0 },
    { silnik: '2.0 CRDi 184', km: 184, nm: 400, ecu: 'Bosch EDC17C57', cap: 2.0 },
    { silnik: '2.2 CRDi 197', km: 197, nm: 441, ecu: 'Bosch EDC17C57', cap: 2.2 },
  ],
  kia_petrol_turbo: [
    { silnik: '1.0 T-GDI 100',km: 100, nm: 172, ecu: 'Continental SIM2K-260', cap: 1.0 },
    { silnik: '1.0 T-GDI 120',km: 120, nm: 172, ecu: 'Continental SIM2K-260', cap: 1.0 },
    { silnik: '1.4 T-GDI 140',km: 140, nm: 242, ecu: 'Continental SIM2K-260', cap: 1.4 },
    { silnik: '1.6 T-GDI 177',km: 177, nm: 265, ecu: 'Continental SIM2K-261', cap: 1.6 },
    { silnik: '1.6 T-GDI 204',km: 204, nm: 265, ecu: 'Continental SIM2K-261', cap: 1.6 },
    { silnik: '2.0 T-GDI 250',km: 250, nm: 353, ecu: 'Continental SIM2K-261', cap: 2.0 },
    { silnik: '3.3 T-GDI 370',km: 370, nm: 510, ecu: 'Continental SIM2K-260', cap: 3.3 },
  ],
  kia_petrol_na: [
    { silnik: '1.0 MPI 67',  km: 67,  nm: 96,  ecu: 'Bosch ME17.9.21', cap: 1.0 },
    { silnik: '1.2 MPI 84',  km: 84,  nm: 122, ecu: 'Bosch ME17.9.21', cap: 1.2 },
    { silnik: '1.4 MPI 100', km: 100, nm: 134, ecu: 'Bosch ME17.9.11', cap: 1.4 },
    { silnik: '1.6 MPI 124', km: 124, nm: 156, ecu: 'Bosch ME17.9.11', cap: 1.6 },
    { silnik: '2.0 MPI 152', km: 152, nm: 192, ecu: 'Continental SIM2K', cap: 2.0 },
  ],

  // ---------- Toyota ----------
  toyota_diesel: [
    { silnik: '1.4 D-4D 90',  km: 90,  nm: 205, ecu: 'Denso 89663-xxxx', cap: 1.4 },
    { silnik: '1.6 D-4D 112', km: 112, nm: 270, ecu: 'Bosch EDC17C54', cap: 1.6 },
    { silnik: '2.0 D-4D 124', km: 124, nm: 300, ecu: 'Denso 89663',  cap: 2.0 },
    { silnik: '2.0 D-4D 143', km: 143, nm: 320, ecu: 'Denso 89663',  cap: 2.0 },
    { silnik: '2.2 D-4D 150', km: 150, nm: 340, ecu: 'Denso 89663',  cap: 2.2 },
    { silnik: '2.2 D-CAT 177',km: 177, nm: 400, ecu: 'Denso 89663',  cap: 2.2 },
    { silnik: '2.5 D-4D 144', km: 144, nm: 343, ecu: 'Denso 89663',  cap: 2.5 },
    { silnik: '2.8 D-4D 177', km: 177, nm: 450, ecu: 'Denso 89663',  cap: 2.8 },
    { silnik: '3.0 D-4D 173', km: 173, nm: 410, ecu: 'Denso 89663',  cap: 3.0 },
  ],
  toyota_petrol_turbo: [
    { silnik: '1.2 T 116',  km: 116, nm: 185, ecu: 'Denso 89663',  cap: 1.2 },
    { silnik: '2.0 T 245',  km: 245, nm: 350, ecu: 'Denso 89663',  cap: 2.0 },
    { silnik: '3.5 T 421',  km: 421, nm: 588, ecu: 'Denso 89663',  cap: 3.5 },
  ],
  toyota_petrol_na: [
    { silnik: '1.0 VVT-i 69',  km: 69,  nm: 95,  ecu: 'Denso 89663',  cap: 1.0 },
    { silnik: '1.3 VVT-i 99',  km: 99,  nm: 125, ecu: 'Denso 89663',  cap: 1.3 },
    { silnik: '1.4 Dual VVT-i 100', km: 100, nm: 132, ecu: 'Denso 89663',  cap: 1.4 },
    { silnik: '1.6 Dual VVT-i 132', km: 132, nm: 160, ecu: 'Denso 89663',  cap: 1.6 },
    { silnik: '1.8 VVT-i 147', km: 147, nm: 180, ecu: 'Denso 89663',  cap: 1.8 },
    { silnik: '2.0 Dual VVT-i 152', km: 152, nm: 193, ecu: 'Denso 89663',  cap: 2.0 },
  ],

  // ---------- Mazda ----------
  mazda_diesel: [
    { silnik: '1.5 SkyActiv-D 105', km: 105, nm: 220, ecu: 'Mazda PCM',   cap: 1.5 },
    { silnik: '1.6 MZ-CD 90',   km: 90,  nm: 215, ecu: 'Bosch EDC17',    cap: 1.6 },
    { silnik: '2.0 SkyActiv-D 150', km: 150, nm: 380, ecu: 'Mazda PCM',  cap: 2.0 },
    { silnik: '2.2 SkyActiv-D 150', km: 150, nm: 380, ecu: 'Mazda PCM',  cap: 2.2 },
    { silnik: '2.2 SkyActiv-D 175', km: 175, nm: 420, ecu: 'Mazda PCM',  cap: 2.2 },
    { silnik: '2.2 MZ-CD 163',  km: 163, nm: 360, ecu: 'Bosch EDC17',    cap: 2.2 },
  ],
  mazda_petrol_na: [
    { silnik: '1.5 SkyActiv-G 100', km: 100, nm: 150, ecu: 'Mazda PCM', cap: 1.5 },
    { silnik: '1.5 SkyActiv-G 115', km: 115, nm: 150, ecu: 'Mazda PCM', cap: 1.5 },
    { silnik: '2.0 SkyActiv-G 120', km: 120, nm: 210, ecu: 'Mazda PCM', cap: 2.0 },
    { silnik: '2.0 SkyActiv-G 165', km: 165, nm: 213, ecu: 'Mazda PCM', cap: 2.0 },
    { silnik: '2.5 SkyActiv-G 192', km: 192, nm: 258, ecu: 'Mazda PCM', cap: 2.5 },
  ],

  // ---------- Honda ----------
  honda_diesel: [
    { silnik: '1.6 i-DTEC 120', km: 120, nm: 300, ecu: 'Bosch EDC17C58', cap: 1.6 },
    { silnik: '2.2 i-CTDi 140', km: 140, nm: 340, ecu: 'Bosch EDC16',   cap: 2.2 },
    { silnik: '2.2 i-DTEC 150', km: 150, nm: 350, ecu: 'Bosch EDC17C58', cap: 2.2 },
  ],
  honda_petrol_turbo: [
    { silnik: '1.0 VTEC Turbo 129', km: 129, nm: 200, ecu: 'Keihin', cap: 1.0 },
    { silnik: '1.5 VTEC Turbo 182', km: 182, nm: 240, ecu: 'Keihin', cap: 1.5 },
    { silnik: '2.0 VTEC Turbo 320', km: 320, nm: 400, ecu: 'Keihin', cap: 2.0 },
  ],
  honda_petrol_na: [
    { silnik: '1.2 i-VTEC 90',  km: 90,  nm: 114, ecu: 'Keihin', cap: 1.2 },
    { silnik: '1.4 i-VTEC 100', km: 100, nm: 127, ecu: 'Keihin', cap: 1.4 },
    { silnik: '1.6 i-VTEC 125', km: 125, nm: 152, ecu: 'Keihin', cap: 1.6 },
    { silnik: '1.8 i-VTEC 142', km: 142, nm: 174, ecu: 'Keihin', cap: 1.8 },
    { silnik: '2.0 i-VTEC 155', km: 155, nm: 190, ecu: 'Keihin', cap: 2.0 },
  ],

  // ---------- Volvo ----------
  volvo_diesel: [
    { silnik: 'D2 1.6',   km: 115, nm: 270, ecu: 'Denso',         cap: 1.6 },
    { silnik: 'D2 2.0',   km: 120, nm: 280, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'D3 2.0',   km: 150, nm: 320, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'D4 2.0',   km: 190, nm: 400, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'D5 2.0',   km: 235, nm: 480, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'D5 2.4',   km: 215, nm: 440, ecu: 'Denso',         cap: 2.4 },
    { silnik: 'D5 2.4 AWD', km: 230, nm: 440, ecu: 'Denso',       cap: 2.4 },
  ],
  volvo_petrol_turbo: [
    { silnik: 'T2 2.0',   km: 122, nm: 220, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'T3 2.0',   km: 152, nm: 250, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'T4 2.0',   km: 190, nm: 300, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'T5 2.0',   km: 245, nm: 350, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'T6 2.0',   km: 320, nm: 400, ecu: 'Denso',         cap: 2.0 },
    { silnik: 'T8 2.0 AWD', km: 407, nm: 640, ecu: 'Denso',       cap: 2.0 },
  ],

  // ---------- Nissan / Infiniti ----------
  nissan_diesel: [
    { silnik: '1.5 dCi 90',  km: 90,  nm: 220, ecu: 'Continental', cap: 1.5 },
    { silnik: '1.5 dCi 110', km: 110, nm: 260, ecu: 'Continental', cap: 1.5 },
    { silnik: '1.6 dCi 130', km: 130, nm: 320, ecu: 'Continental', cap: 1.6 },
    { silnik: '2.0 dCi 150', km: 150, nm: 360, ecu: 'Bosch EDC17', cap: 2.0 },
    { silnik: '2.3 dCi 145', km: 145, nm: 350, ecu: 'Continental', cap: 2.3 },
    { silnik: '2.3 dCi 170', km: 170, nm: 380, ecu: 'Continental', cap: 2.3 },
    { silnik: '2.5 dCi 190', km: 190, nm: 450, ecu: 'Bosch EDC17', cap: 2.5 },
    { silnik: '3.0 dCi 235', km: 235, nm: 550, ecu: 'Bosch EDC17', cap: 3.0 },
  ],
  nissan_petrol_turbo: [
    { silnik: '1.2 DIG-T 115', km: 115, nm: 190, ecu: 'Continental', cap: 1.2 },
    { silnik: '1.3 DIG-T 140', km: 140, nm: 240, ecu: 'Bosch MED17', cap: 1.3 },
    { silnik: '1.3 DIG-T 160', km: 160, nm: 270, ecu: 'Bosch MED17', cap: 1.3 },
    { silnik: '1.6 DIG-T 163', km: 163, nm: 240, ecu: 'Continental', cap: 1.6 },
    { silnik: '1.6 DIG-T 200', km: 200, nm: 280, ecu: 'Continental', cap: 1.6 },
    { silnik: 'GT-R 3.8 Bi',   km: 570, nm: 637, ecu: 'Hitachi',     cap: 3.8 },
  ],
  nissan_petrol_na: [
    { silnik: '1.2 16V 80',  km: 80,  nm: 110, ecu: 'Continental', cap: 1.2 },
    { silnik: '1.6 16V 110', km: 110, nm: 153, ecu: 'Continental', cap: 1.6 },
    { silnik: '1.8 16V 140', km: 140, nm: 174, ecu: 'Continental', cap: 1.8 },
    { silnik: '2.0 16V 140', km: 140, nm: 196, ecu: 'Continental', cap: 2.0 },
    { silnik: '370Z 3.7 V6', km: 328, nm: 366, ecu: 'Hitachi',     cap: 3.7 },
  ],

  // ---------- Subaru / Suzuki / Mitsubishi ----------
  subaru_petrol_na: [
    { silnik: '1.6i 114',  km: 114, nm: 150, ecu: 'Denso', cap: 1.6 },
    { silnik: '2.0i 156',  km: 156, nm: 196, ecu: 'Denso', cap: 2.0 },
    { silnik: '2.5i 175',  km: 175, nm: 235, ecu: 'Denso', cap: 2.5 },
    { silnik: '2.5i 167',  km: 167, nm: 226, ecu: 'Denso', cap: 2.5 },
    { silnik: '3.6R 260',  km: 260, nm: 350, ecu: 'Denso', cap: 3.6 },
  ],
  subaru_petrol_turbo: [
    { silnik: '1.6 DIT 170', km: 170, nm: 250, ecu: 'Denso', cap: 1.6 },
    { silnik: '2.0 DIT 240', km: 240, nm: 350, ecu: 'Denso', cap: 2.0 },
    { silnik: 'WRX 2.0 268', km: 268, nm: 350, ecu: 'Denso', cap: 2.0 },
    { silnik: 'WRX 2.4 271', km: 271, nm: 350, ecu: 'Denso', cap: 2.4 },
    { silnik: 'STI 2.5 300', km: 300, nm: 407, ecu: 'Denso', cap: 2.5 },
  ],
  subaru_diesel: [
    { silnik: '2.0 D 150',  km: 150, nm: 350, ecu: 'Denso', cap: 2.0 },
  ],
  suzuki_petrol_na: [
    { silnik: '1.0 80',   km: 80,  nm: 90,  ecu: 'Denso',  cap: 1.0 },
    { silnik: '1.2 90',   km: 90,  nm: 118, ecu: 'Denso',  cap: 1.2 },
    { silnik: '1.4 95',   km: 95,  nm: 130, ecu: 'Denso',  cap: 1.4 },
    { silnik: '1.6 120',  km: 120, nm: 156, ecu: 'Denso',  cap: 1.6 },
  ],
  suzuki_petrol_turbo: [
    { silnik: '1.0 BoosterJet 102', km: 102, nm: 170, ecu: 'Denso', cap: 1.0 },
    { silnik: '1.0 BoosterJet 111', km: 111, nm: 170, ecu: 'Denso', cap: 1.0 },
    { silnik: '1.4 BoosterJet 140', km: 140, nm: 220, ecu: 'Denso', cap: 1.4 },
  ],
  suzuki_diesel: [
    { silnik: '1.6 DDiS 120', km: 120, nm: 320, ecu: 'Bosch EDC17', cap: 1.6 },
  ],
  mitsubishi_diesel: [
    { silnik: '1.5 DI-D 95',  km: 95,  nm: 240, ecu: 'Bosch EDC17', cap: 1.5 },
    { silnik: '1.8 DI-D 116', km: 116, nm: 270, ecu: 'Bosch EDC17', cap: 1.8 },
    { silnik: '2.2 DI-D 150', km: 150, nm: 360, ecu: 'Denso',        cap: 2.2 },
    { silnik: '2.4 DI-D 180', km: 180, nm: 430, ecu: 'Denso',        cap: 2.4 },
    { silnik: '2.5 DI-D 178', km: 178, nm: 400, ecu: 'Denso',        cap: 2.5 },
    { silnik: '3.2 DI-D 200', km: 200, nm: 441, ecu: 'Denso',        cap: 3.2 },
  ],
  mitsubishi_petrol_turbo: [
    { silnik: '1.5 T 163',   km: 163, nm: 250, ecu: 'Denso',        cap: 1.5 },
    { silnik: 'Lancer Evo 2.0 295', km: 295, nm: 407, ecu: 'Denso', cap: 2.0 },
  ],
  mitsubishi_petrol_na: [
    { silnik: '1.2 80',   km: 80,  nm: 106, ecu: 'Denso',        cap: 1.2 },
    { silnik: '1.6 117',  km: 117, nm: 154, ecu: 'Denso',        cap: 1.6 },
    { silnik: '2.0 150',  km: 150, nm: 198, ecu: 'Denso',        cap: 2.0 },
  ],

  // ---------- Jaguar / Land Rover ----------
  jaguar_diesel: [
    { silnik: '2.0d 163',  km: 163, nm: 380, ecu: 'Bosch EDC17', cap: 2.0 },
    { silnik: '2.0d 180',  km: 180, nm: 430, ecu: 'Bosch EDC17', cap: 2.0 },
    { silnik: '2.0d 240',  km: 240, nm: 500, ecu: 'Bosch EDC17', cap: 2.0 },
    { silnik: '3.0d 275',  km: 275, nm: 600, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '3.0d 300',  km: 300, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
  ],
  jaguar_petrol_turbo: [
    { silnik: '2.0 200',  km: 200, nm: 320, ecu: 'Bosch MED17', cap: 2.0 },
    { silnik: '2.0 250',  km: 250, nm: 365, ecu: 'Bosch MED17', cap: 2.0 },
    { silnik: '2.0 300',  km: 300, nm: 400, ecu: 'Bosch MED17', cap: 2.0 },
    { silnik: '3.0 V6 380', km: 380, nm: 460, ecu: 'Bosch MED17', cap: 3.0 },
    { silnik: 'F-Type 5.0 V8 550', km: 550, nm: 680, ecu: 'Bosch MED17', cap: 5.0 },
  ],
  lr_diesel: [
    { silnik: '2.0 D150', km: 150, nm: 380, ecu: 'Bosch EDC17',    cap: 2.0 },
    { silnik: '2.0 D180', km: 180, nm: 430, ecu: 'Bosch EDC17',    cap: 2.0 },
    { silnik: '2.0 D240', km: 240, nm: 500, ecu: 'Bosch EDC17',    cap: 2.0 },
    { silnik: '3.0 SDV6 258', km: 258, nm: 600, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '3.0 SDV6 306', km: 306, nm: 700, ecu: 'Bosch EDC17CP09', cap: 3.0 },
    { silnik: '4.4 SDV8 339', km: 339, nm: 740, ecu: 'Bosch EDC17CP09', cap: 4.4 },
  ],
  lr_petrol_turbo: [
    { silnik: '2.0 P200',  km: 200, nm: 320, ecu: 'Bosch MED17',  cap: 2.0 },
    { silnik: '2.0 P250',  km: 250, nm: 365, ecu: 'Bosch MED17',  cap: 2.0 },
    { silnik: '2.0 P300',  km: 300, nm: 400, ecu: 'Bosch MED17',  cap: 2.0 },
    { silnik: '3.0 P400',  km: 400, nm: 550, ecu: 'Bosch MED17',  cap: 3.0 },
    { silnik: '5.0 V8 525',km: 525, nm: 625, ecu: 'Bosch MED17',  cap: 5.0 },
  ],

  // ---------- Porsche ----------
  porsche_diesel: [
    { silnik: '3.0 V6 TDI 211', km: 211, nm: 550, ecu: 'Bosch EDC17CP44', cap: 3.0 },
    { silnik: '3.0 V6 TDI 245', km: 245, nm: 550, ecu: 'Bosch EDC17CP44', cap: 3.0 },
    { silnik: '3.0 V6 TDI 262', km: 262, nm: 580, ecu: 'Bosch EDC17CP44', cap: 3.0 },
    { silnik: '4.2 V8 TDI 385', km: 385, nm: 850, ecu: 'Bosch EDC17CP54', cap: 4.2 },
  ],
  porsche_petrol_turbo: [
    { silnik: '2.0 T 252',  km: 252, nm: 370, ecu: 'Bosch MED17',  cap: 2.0 },
    { silnik: '2.5 T 354',  km: 354, nm: 500, ecu: 'Bosch MED17',  cap: 2.5 },
    { silnik: '3.0 V6 340', km: 340, nm: 450, ecu: 'Bosch MED17',  cap: 3.0 },
    { silnik: '3.0 V6 440', km: 440, nm: 550, ecu: 'Bosch MED17',  cap: 3.0 },
    { silnik: '4.0 V8 460', km: 460, nm: 620, ecu: 'Bosch MED17',  cap: 4.0 },
    { silnik: '911 3.0 Carrera 385', km: 385, nm: 450, ecu: 'Bosch MED17',  cap: 3.0 },
    { silnik: '911 3.0 Carrera S 450', km: 450, nm: 530, ecu: 'Bosch MED17',  cap: 3.0 },
    { silnik: '911 3.7 Turbo 580', km: 580, nm: 750, ecu: 'Bosch MED17',  cap: 3.7 },
    { silnik: '4.0 V8 GTS 480', km: 480, nm: 620, ecu: 'Bosch MED17',  cap: 4.0 },
  ],

  // ---------- Mini ----------
  mini_diesel: [
    { silnik: 'Cooper D 1.5', km: 116, nm: 270, ecu: 'Bosch EDC17C50', cap: 1.5 },
    { silnik: 'Cooper SD 2.0',km: 170, nm: 360, ecu: 'Bosch EDC17C50', cap: 2.0 },
    { silnik: 'Cooper SD 2.0 190', km: 190, nm: 400, ecu: 'Bosch EDC17C50', cap: 2.0 },
  ],
  mini_petrol_turbo: [
    { silnik: 'Cooper 1.5',  km: 136, nm: 220, ecu: 'Bosch MEVD17.2.4', cap: 1.5 },
    { silnik: 'Cooper S 2.0',km: 192, nm: 280, ecu: 'Bosch MEVD17.2.4', cap: 2.0 },
    { silnik: 'JCW 2.0',     km: 231, nm: 320, ecu: 'Bosch MEVD17.2.4', cap: 2.0 },
    { silnik: 'JCW 2.0 306', km: 306, nm: 450, ecu: 'Bosch MEVD17.2.4', cap: 2.0 },
  ],

  // ---------- Smart / Saab / Iveco / SsangYong / Chevrolet / Cadillac ----------
  smart_petrol_turbo: [
    { silnik: '0.9 90', km: 90, nm: 135, ecu: 'Continental', cap: 0.9 },
  ],
  saab_petrol_turbo: [
    { silnik: '1.8t 150', km: 150, nm: 240, ecu: 'Trionic 8', cap: 1.8 },
    { silnik: '2.0T 175', km: 175, nm: 265, ecu: 'Trionic 8', cap: 2.0 },
    { silnik: '2.0T 220', km: 220, nm: 300, ecu: 'Trionic 8', cap: 2.0 },
    { silnik: '2.8 V6 280', km: 280, nm: 400, ecu: 'Trionic 8', cap: 2.8 },
  ],
  iveco_diesel: [
    { silnik: '2.3 HPI 116', km: 116, nm: 320, ecu: 'Bosch EDC16',   cap: 2.3 },
    { silnik: '2.3 HPI 136', km: 136, nm: 350, ecu: 'Bosch EDC17',   cap: 2.3 },
    { silnik: '2.3 HPI 156', km: 156, nm: 380, ecu: 'Bosch EDC17',   cap: 2.3 },
    { silnik: '3.0 HPI 146', km: 146, nm: 350, ecu: 'Bosch EDC16',   cap: 3.0 },
    { silnik: '3.0 HPI 170', km: 170, nm: 400, ecu: 'Bosch EDC17',   cap: 3.0 },
    { silnik: '3.0 HPI 180', km: 180, nm: 430, ecu: 'Bosch EDC17',   cap: 3.0 },
    { silnik: '3.0 HPI 205', km: 205, nm: 470, ecu: 'Bosch EDC17',   cap: 3.0 },
  ],
  ssang_diesel: [
    { silnik: '1.6 e-XDi 115', km: 115, nm: 300, ecu: 'Delphi DCM3.7', cap: 1.6 },
    { silnik: '2.0 XDi 155', km: 155, nm: 360, ecu: 'Delphi DCM3.7',  cap: 2.0 },
    { silnik: '2.2 XDi 178', km: 178, nm: 400, ecu: 'Delphi DCM3.7',  cap: 2.2 },
  ],
  ssang_petrol_na: [
    { silnik: '1.6 GDi 128', km: 128, nm: 160, ecu: 'Continental', cap: 1.6 },
    { silnik: '2.0 132',     km: 132, nm: 197, ecu: 'Continental', cap: 2.0 },
  ],
  chevrolet_diesel: [
    { silnik: '1.6 CDTi 110', km: 110, nm: 260, ecu: 'Bosch EDC17C18', cap: 1.6 },
    { silnik: '1.7 CDTi 110', km: 110, nm: 280, ecu: 'Bosch EDC17C18', cap: 1.7 },
    { silnik: '2.0 VCDi 150', km: 150, nm: 320, ecu: 'Bosch EDC17C18', cap: 2.0 },
  ],
  chevrolet_petrol_turbo: [
    { silnik: '1.4T 140',  km: 140, nm: 200, ecu: 'AC Delco E80', cap: 1.4 },
    { silnik: 'Camaro 2.0T 275', km: 275, nm: 400, ecu: 'AC Delco', cap: 2.0 },
    { silnik: 'Corvette 6.2 V8 sc 650', km: 650, nm: 881, ecu: 'AC Delco', cap: 6.2 },
  ],
  chevrolet_petrol_na: [
    { silnik: '1.2 86',  km: 86,  nm: 113, ecu: 'AC Delco', cap: 1.2 },
    { silnik: '1.6 115', km: 115, nm: 155, ecu: 'AC Delco', cap: 1.6 },
    { silnik: '2.0 143', km: 143, nm: 184, ecu: 'AC Delco', cap: 2.0 },
    { silnik: 'Camaro 3.6 V6 335', km: 335, nm: 385, ecu: 'AC Delco', cap: 3.6 },
    { silnik: 'Corvette 6.2 V8 466', km: 466, nm: 630, ecu: 'AC Delco', cap: 6.2 },
  ],
  cadillac_petrol_turbo: [
    { silnik: '2.0T 276', km: 276, nm: 400, ecu: 'AC Delco', cap: 2.0 },
    { silnik: '3.6 TT V6 420', km: 420, nm: 583, ecu: 'AC Delco', cap: 3.6 },
  ],
  cadillac_petrol_na: [
    { silnik: '3.6 V6 335', km: 335, nm: 385, ecu: 'AC Delco', cap: 3.6 },
    { silnik: 'Escalade 6.2 V8 426', km: 426, nm: 624, ecu: 'AC Delco', cap: 6.2 },
  ],
  cadillac_diesel: [
    { silnik: '3.0 TD V6 270', km: 270, nm: 599, ecu: 'AC Delco', cap: 3.0 },
  ],
};

// --------------------------- BAZA MODELI / GENERACJI ---------------------------

const BRANDS = require('./synthetic-brands.js');

// ----------------------------- HELPERY GENERATORA -----------------------------

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l').replace(/Ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Bardzo ostrożne mnożniki - nigdy nie ocieramy się o realne limity Stage 1.
// Diesele: typowo Stage 1 = +25-35%. My deklarujemy +8% / +9% Nm.
// Benzyna turbo: typowo Stage 1 = +15-25%. My deklarujemy +6% / +7%.
// Benzyna NA: typowo Stage 1 = +4-8%. My deklarujemy +2% / +2%.
const GAINS = {
  diesel:        { km: 0.08, nm: 0.09 },
  petrol_turbo:  { km: 0.06, nm: 0.07 },
  petrol_na:     { km: 0.02, nm: 0.02 },
};

function characterFromPoolName(poolName) {
  if (poolName.endsWith('_diesel')) return 'diesel';
  if (poolName.endsWith('_petrol_turbo')) return 'petrol_turbo';
  if (poolName.endsWith('_petrol_na')) return 'petrol_na';
  return null; // unknown - caller should fall back to per-entry detection
}

// Heurystyka rozpoznawania charakteru silnika z nazwy. Używana przez puli
// per-model BMW (bmw_seria_*_*, bmw_x*_*, bmw_m*_*) gdzie nazwa puli nie
// koduje typu paliwa.
function characterFromSilnik(silnik) {
  const s = String(silnik || '');
  // Diesle: nazwy typu "320d 2.0", "xDrive 30d 3.0", "M40d 3.0", "M50d 3.0",
  // "M340d", a także klasyczne marki diesli (TDI, HDi, CDI, dCi, ...).
  if (/(?:^|\s|M)\d+d(?:\s|$)/.test(s)) return 'diesel';
  if (/\b(?:TDI|HDi|CDI|CDTI|CRDI|dCi|JTD|JTDM|MultiJet|D-?4D|BlueHDi|BlueTec|SDI|i-DTEC|i-CTDI|SkyActiv-?D)\b/i.test(s)) return 'diesel';
  // Domyślnie traktujemy jako benzynę turbo (większość nowoczesnych BMW).
  // Stare wolnossące R6 (M3 V8 S65, M5 V10 S85, 525i NA itp.) i tak dostają
  // bardzo ostrożny zysk - akceptujemy lekkie zaokrąglenie w górę.
  return 'petrol_turbo';
}

function characterFor(poolName, entry) {
  if (entry && entry.ch) return entry.ch;
  const fromPool = characterFromPoolName(poolName);
  if (fromPool) return fromPool;
  return characterFromSilnik(entry && entry.silnik);
}

function paliwoFromCharacter(ch) {
  return ch === 'diesel' ? 'diesel' : 'benzyna';
}

function applyGain(km, nm, ch) {
  const g = GAINS[ch] || GAINS.diesel;
  // Zaokrąglenia w bezpieczną stronę: KM do najbliższego 1, Nm do najbliższych 5.
  const tunedKm = Math.round(km * (1 + g.km));
  const tunedNm = Math.round((nm * (1 + g.nm)) / 5) * 5;
  return { km1: tunedKm, nm1: tunedNm };
}

const KW_FACTOR = 0.7355; // 1 KM = 0.7355 kW

function buildSyntheticCatalog() {
  const out = [];
  const seenSlugs = new Set();

  for (const brand of BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.gens) {
        // Optional per-gen / per-model filtering. Engine names in the pools
        // sometimes carry model-specific prefixes (e.g. BMW "320d", Mercedes
        // "C 220 d") so we let each gen narrow down which engines from a pool
        // actually belong to that model+gen. Filters are AND-combined.
        // - silnikRe: regex - engine name must match
        // - capMax / capMin: number - cap must be <= / >= that value
        // - excludeRe: regex - engine name must NOT match (used to exclude
        //   M-cars from the regular series)
        const filterRe = gen.silnikRe || (model.silnikRe || null);
        const excludeRe = gen.excludeRe || (model.excludeRe || null);
        const capMax = gen.capMax != null ? gen.capMax : model.capMax;
        const capMin = gen.capMin != null ? gen.capMin : model.capMin;
        for (const poolName of gen.pools) {
          const pool = POOLS[poolName];
          if (!pool) continue;
          for (const v of pool) {
            if (filterRe && !filterRe.test(v.silnik)) continue;
            if (excludeRe && excludeRe.test(v.silnik)) continue;
            if (capMax != null && v.cap != null && v.cap > capMax) continue;
            if (capMin != null && v.cap != null && v.cap < capMin) continue;
            const ch = characterFor(poolName, v);
            const paliwo = paliwoFromCharacter(ch);
            const km0 = v.km, nm0 = v.nm;
            const { km1, nm1 } = applyGain(km0, nm0, ch);
            const kw0 = Math.round(km0 * KW_FACTOR);
            const kw1 = Math.round(km1 * KW_FACTOR);

            const slugBase = slugify(
              [brand.name, model.name, gen.code, v.silnik].join(' ')
            );
            // Disambiguate w razie kolizji.
            let slug = slugBase;
            let n = 2;
            while (seenSlugs.has(slug)) { slug = slugBase + '-' + (n++); }
            seenSlugs.add(slug);

            out.push({
              marka: brand.name,
              model: model.name,
              generacja: gen.code,
              rok_od: String(gen.y0),
              rok_do: String(gen.y1),
              silnik: v.silnik,
              moc_kw_seryjna: kw0,
              moc_km_seryjna: km0,
              moc_kw_tuning: kw1,
              moc_km_tuning: km1,
              moment_seryjny: nm0,
              moment_tuning: nm1,
              sterownik: v.ecu,
              slug,
              marka_slug: slugify(brand.name),
              silnik_slug: slugify(brand.name + ' ' + v.silnik),
              sterownik_slug: slugify(v.ecu),
              paliwo,
              pojemnosc: v.cap,
              diff_km: km1 - km0,
              diff_nm: nm1 - nm0,
              diff_pct: km0 ? Math.round(((km1 - km0) / km0) * 100) : 0,
              synthetic: true,
              character: ch,
            });
          }
        }
      }
    }
  }
  return out;
}

module.exports = { buildSyntheticCatalog };
