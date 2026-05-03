'use strict';

// Każda generacja: { code, y0, y1, pools: [...] }
// Pule używane: vag_diesel, vag_petrol_turbo, vag_petrol_na, bmw_*, mb_*, ford_*,
// psa_*, renault_*, fiat_*, toyota_*, hyundai_*, volvo_*, honda_*, mazda_*,
// nissan_*, kia_*, alfa_*, jaguar_*, lr_*, porsche_*, smart_*, saab_*, mini_*,
// subaru_*, suzuki_*, mitsubishi_*, dacia_*, jeep_*, iveco_*, ssang_*, lancia_*,
// chevrolet_*, cadillac_*, dodge_*, chrysler_*

const VAG_ALL = ['vag_diesel', 'vag_petrol_turbo', 'vag_petrol_na'];
const BMW_ALL = ['bmw_diesel', 'bmw_petrol_turbo', 'bmw_petrol_na'];
const MB_ALL  = ['mb_diesel', 'mb_petrol_turbo', 'mb_petrol_na'];
const FORD_ALL = ['ford_diesel', 'ford_petrol_turbo', 'ford_petrol_na'];
const PSA_ALL = ['psa_diesel', 'psa_petrol_turbo', 'psa_petrol_na'];
const REN_ALL = ['renault_diesel', 'renault_petrol_turbo', 'renault_petrol_na'];
const FIAT_ALL = ['fiat_diesel', 'fiat_petrol_turbo', 'fiat_petrol_na'];
const TOY_ALL = ['toyota_diesel', 'toyota_petrol_turbo', 'toyota_petrol_na'];
const HYU_ALL = ['hyundai_diesel', 'hyundai_petrol_turbo', 'hyundai_petrol_na'];
const KIA_ALL = ['kia_diesel', 'kia_petrol_turbo', 'kia_petrol_na'];
const VOLVO_ALL = ['volvo_diesel', 'volvo_petrol_turbo'];
const HONDA_ALL = ['honda_diesel', 'honda_petrol_na', 'honda_petrol_turbo'];
const MAZDA_ALL = ['mazda_diesel', 'mazda_petrol_na'];
const NISSAN_ALL = ['nissan_diesel', 'nissan_petrol_turbo', 'nissan_petrol_na'];
const ALFA_ALL = ['alfa_diesel', 'alfa_petrol_turbo'];
const JAG_ALL = ['jaguar_diesel', 'jaguar_petrol_turbo'];
const LR_ALL = ['lr_diesel', 'lr_petrol_turbo'];
const POR_ALL = ['porsche_diesel', 'porsche_petrol_turbo'];
const MINI_ALL = ['mini_diesel', 'mini_petrol_turbo'];
const SUB_ALL = ['subaru_petrol_na', 'subaru_petrol_turbo', 'subaru_diesel'];
const SUZ_ALL = ['suzuki_petrol_na', 'suzuki_petrol_turbo', 'suzuki_diesel'];
const MIT_ALL = ['mitsubishi_diesel', 'mitsubishi_petrol_turbo', 'mitsubishi_petrol_na'];
const DAC_ALL = ['dacia_diesel', 'dacia_petrol_turbo', 'dacia_petrol_na'];
const JEEP_ALL = ['jeep_diesel', 'jeep_petrol_turbo', 'jeep_petrol_na'];
const SSANG_ALL = ['ssang_diesel', 'ssang_petrol_na'];
const LANCIA_ALL = ['lancia_diesel', 'lancia_petrol_na'];
const CHEV_ALL = ['chevrolet_diesel', 'chevrolet_petrol_turbo', 'chevrolet_petrol_na'];
const CAD_ALL = ['cadillac_petrol_turbo', 'cadillac_petrol_na', 'cadillac_diesel'];
const DODGE_ALL = ['dodge_petrol_na', 'dodge_petrol_turbo'];
const CHRY_ALL = ['chrysler_petrol_na', 'chrysler_diesel'];

// Helper: tworzy generacje z prostego "code:y0-y1"
const G = (code, y0, y1, pools) => ({ code, y0, y1, pools });

module.exports = [
  // ---------- VAG ----------
  // Małe modele dostają capMax (silniki większe niż X.X litra są wykluczane).
  { key: 'vw', name: 'Volkswagen', models: [
    { name: 'Polo', capMax: 2.0, gens: [G('IV (9N)', 2001, 2009, VAG_ALL), G('V (6R)', 2009, 2017, VAG_ALL), G('VI (AW)', 2017, 2024, VAG_ALL)] },
    { name: 'Golf', capMax: 3.2, gens: [G('IV', 1997, 2003, VAG_ALL), G('V', 2003, 2008, VAG_ALL), G('VI', 2008, 2012, VAG_ALL), G('VII', 2012, 2019, VAG_ALL), G('VIII', 2019, 2025, VAG_ALL)] },
    { name: 'Jetta', capMax: 2.5, gens: [G('V', 2005, 2010, VAG_ALL), G('VI', 2010, 2018, VAG_ALL), G('VII', 2018, 2025, VAG_ALL)] },
    { name: 'Passat', capMax: 3.6, gens: [G('B5', 1996, 2005, VAG_ALL), G('B6', 2005, 2010, VAG_ALL), G('B7', 2010, 2014, VAG_ALL), G('B8', 2014, 2023, VAG_ALL)] },
    { name: 'Arteon', capMax: 2.5, gens: [G('I', 2017, 2024, VAG_ALL)] },
    { name: 'Touran', capMax: 2.0, gens: [G('I', 2003, 2015, VAG_ALL), G('II', 2015, 2024, VAG_ALL)] },
    { name: 'Sharan', capMax: 2.0, gens: [G('II', 2010, 2022, VAG_ALL)] },
    { name: 'Tiguan', capMax: 2.5, gens: [G('I', 2007, 2016, VAG_ALL), G('II', 2016, 2024, VAG_ALL)] },
    { name: 'Touareg', gens: [G('I', 2002, 2010, VAG_ALL), G('II', 2010, 2018, VAG_ALL), G('III', 2018, 2024, VAG_ALL)] },
    { name: 'T5', capMax: 2.5, gens: [G('Transporter T5', 2003, 2015, ['vag_diesel','vag_petrol_turbo'])] },
    { name: 'T6', capMax: 2.0, gens: [G('Transporter T6', 2015, 2024, ['vag_diesel','vag_petrol_turbo'])] },
    { name: 'Caddy', capMax: 2.0, gens: [G('III', 2003, 2015, ['vag_diesel','vag_petrol_na']), G('IV', 2015, 2020, ['vag_diesel','vag_petrol_turbo']), G('V', 2020, 2024, ['vag_diesel','vag_petrol_turbo'])] },
    { name: 'Crafter', capMax: 2.5, gens: [G('I', 2006, 2017, ['vag_diesel']), G('II', 2017, 2024, ['vag_diesel'])] },
    { name: 'Up!', capMax: 1.0, gens: [G('I', 2011, 2023, ['vag_petrol_na'])] },
    { name: 'Scirocco', capMax: 2.0, gens: [G('III', 2008, 2017, VAG_ALL)] },
  ]},
  { key: 'audi', name: 'Audi', models: [
    { name: 'A1', capMax: 2.0, gens: [G('I (8X)', 2010, 2018, VAG_ALL), G('II (GB)', 2018, 2024, VAG_ALL)] },
    { name: 'A3', capMax: 2.5, gens: [G('8L', 1996, 2003, VAG_ALL), G('8P', 2003, 2012, VAG_ALL), G('8V', 2012, 2020, VAG_ALL), G('8Y', 2020, 2024, VAG_ALL)] },
    { name: 'A4', capMax: 3.2, gens: [G('B5', 1995, 2001, VAG_ALL), G('B6', 2001, 2005, VAG_ALL), G('B7', 2005, 2008, VAG_ALL), G('B8', 2008, 2015, VAG_ALL), G('B9', 2015, 2024, VAG_ALL)] },
    { name: 'A5', capMax: 3.0, gens: [G('I (8T)', 2007, 2016, VAG_ALL), G('II (F5)', 2016, 2024, VAG_ALL)] },
    { name: 'A6', gens: [G('C5', 1997, 2004, VAG_ALL), G('C6', 2004, 2011, VAG_ALL), G('C7', 2011, 2018, VAG_ALL), G('C8', 2018, 2024, VAG_ALL)] },
    { name: 'A7', gens: [G('I (4G)', 2010, 2018, VAG_ALL), G('II (4K)', 2018, 2024, VAG_ALL)] },
    { name: 'A8', gens: [G('D3', 2002, 2010, VAG_ALL), G('D4', 2010, 2017, VAG_ALL), G('D5', 2017, 2024, VAG_ALL)] },
    { name: 'Q2', capMax: 2.0, gens: [G('I', 2016, 2024, VAG_ALL)] },
    { name: 'Q3', capMax: 2.5, gens: [G('I (8U)', 2011, 2018, VAG_ALL), G('II (F3)', 2018, 2024, VAG_ALL)] },
    { name: 'Q5', capMax: 3.0, gens: [G('I (8R)', 2008, 2017, VAG_ALL), G('II (FY)', 2017, 2024, VAG_ALL)] },
    { name: 'Q7', gens: [G('I (4L)', 2005, 2015, VAG_ALL), G('II (4M)', 2015, 2024, VAG_ALL)] },
    { name: 'Q8', gens: [G('I (4M)', 2018, 2024, VAG_ALL)] },
    { name: 'TT', capMax: 2.5, gens: [G('II (8J)', 2006, 2014, VAG_ALL), G('III (8S)', 2014, 2023, VAG_ALL)] },
  ]},
  { key: 'skoda', name: 'Skoda', models: [
    { name: 'Fabia', capMax: 1.6, gens: [G('I', 1999, 2007, VAG_ALL), G('II', 2007, 2014, VAG_ALL), G('III', 2014, 2021, VAG_ALL), G('IV', 2021, 2024, VAG_ALL)] },
    { name: 'Rapid', capMax: 1.6, gens: [G('I', 2012, 2019, VAG_ALL)] },
    { name: 'Scala', capMax: 1.6, gens: [G('I', 2019, 2024, VAG_ALL)] },
    { name: 'Octavia', capMax: 2.0, gens: [G('I', 1996, 2010, VAG_ALL), G('II', 2004, 2013, VAG_ALL), G('III', 2013, 2020, VAG_ALL), G('IV', 2020, 2024, VAG_ALL)] },
    { name: 'Superb', capMax: 3.6, gens: [G('I', 2001, 2008, VAG_ALL), G('II', 2008, 2015, VAG_ALL), G('III', 2015, 2024, VAG_ALL)] },
    { name: 'Yeti', capMax: 2.0, gens: [G('I', 2009, 2017, VAG_ALL)] },
    { name: 'Karoq', capMax: 2.0, gens: [G('I', 2017, 2024, VAG_ALL)] },
    { name: 'Kodiaq', capMax: 2.0, gens: [G('I', 2016, 2024, VAG_ALL)] },
    { name: 'Roomster', capMax: 1.6, gens: [G('I', 2006, 2015, VAG_ALL)] },
    { name: 'Kamiq', capMax: 1.6, gens: [G('I', 2019, 2024, VAG_ALL)] },
  ]},
  { key: 'seat', name: 'Seat', models: [
    { name: 'Ibiza', capMax: 2.0, gens: [G('III (6L)', 2002, 2008, VAG_ALL), G('IV (6J)', 2008, 2017, VAG_ALL), G('V (KJ)', 2017, 2024, VAG_ALL)] },
    { name: 'Leon', capMax: 2.0, gens: [G('I (1M)', 1999, 2006, VAG_ALL), G('II (1P)', 2005, 2012, VAG_ALL), G('III (5F)', 2012, 2020, VAG_ALL), G('IV (KL)', 2020, 2024, VAG_ALL)] },
    { name: 'Toledo', capMax: 2.0, gens: [G('III (5P)', 2004, 2009, VAG_ALL), G('IV (KG)', 2012, 2019, VAG_ALL)] },
    { name: 'Altea', capMax: 2.0, gens: [G('I', 2004, 2015, VAG_ALL)] },
    { name: 'Ateca', capMax: 2.0, gens: [G('I', 2016, 2024, VAG_ALL)] },
    { name: 'Arona', capMax: 1.6, gens: [G('I', 2017, 2024, VAG_ALL)] },
    { name: 'Tarraco', capMax: 2.0, gens: [G('I', 2018, 2024, VAG_ALL)] },
    { name: 'Alhambra', capMax: 2.0, gens: [G('II', 2010, 2020, VAG_ALL)] },
  ]},
  { key: 'porsche', name: 'Porsche', models: [
    { name: 'Cayenne', gens: [G('I (955/957)', 2002, 2010, POR_ALL), G('II (958)', 2010, 2017, POR_ALL), G('III (9YA)', 2017, 2024, POR_ALL)] },
    { name: 'Macan', gens: [G('I (95B)', 2014, 2024, POR_ALL)] },
    { name: 'Panamera', gens: [G('I (970)', 2009, 2016, POR_ALL), G('II (971)', 2016, 2024, POR_ALL)] },
    { name: '911', gens: [G('997', 2004, 2012, ['porsche_petrol_turbo']), G('991', 2011, 2019, ['porsche_petrol_turbo']), G('992', 2019, 2024, ['porsche_petrol_turbo'])] },
    { name: 'Boxster/Cayman', gens: [G('981', 2012, 2016, ['porsche_petrol_turbo']), G('982', 2016, 2024, ['porsche_petrol_turbo'])] },
  ]},

  // ---------- BMW ----------
  // Każda generacja używa dedykowanej puli silników (bmw_<model>_<gen>),
  // dzięki czemu lista silników jest zgodna z faktyczną ofertą modelu+gen.
  // Modele M (M2/M3/M4/M5/M6/M8) i M-SUV (X3 M / X4 M / X5 M / X6 M) są
  // oddzielnymi modelami, by nie mieszać ich z bazowymi seriami.
  { key: 'bmw', name: 'BMW', models: [
    { name: 'Seria 1', gens: [
      G('E87', 2004, 2011, ['bmw_seria_1_e87']),
      G('F20/F21', 2011, 2019, ['bmw_seria_1_f20']),
      G('F40', 2019, 2024, ['bmw_seria_1_f40']),
    ]},
    { name: 'Seria 2', gens: [
      G('F22/F23', 2014, 2021, ['bmw_seria_2_f22']),
      G('F45/F46 Active/Gran Tourer', 2014, 2021, ['bmw_seria_2_f22']),
      G('G42', 2021, 2024, ['bmw_seria_2_g42']),
      G('U06 Active Tourer', 2021, 2024, ['bmw_seria_2_g42']),
    ]},
    { name: 'Seria 3', gens: [
      G('E46', 1998, 2005, ['bmw_seria_3_e46']),
      G('E90/E91/E92/E93', 2005, 2013, ['bmw_seria_3_e90']),
      G('F30/F31/F34', 2011, 2019, ['bmw_seria_3_f30']),
      G('G20/G21', 2018, 2024, ['bmw_seria_3_g20']),
    ]},
    { name: 'Seria 4', gens: [
      G('F32/F33/F36', 2013, 2020, ['bmw_seria_4_f32']),
      G('G22/G23/G26', 2020, 2024, ['bmw_seria_4_g22']),
    ]},
    { name: 'Seria 5', gens: [
      G('E39', 1995, 2004, ['bmw_seria_5_e39']),
      G('E60/E61', 2003, 2010, ['bmw_seria_5_e60']),
      G('F10/F11/F07', 2009, 2017, ['bmw_seria_5_f10']),
      G('G30/G31', 2017, 2023, ['bmw_seria_5_g30']),
      G('G60/G61', 2023, 2024, ['bmw_seria_5_g60']),
    ]},
    { name: 'Seria 6', gens: [
      G('E63/E64', 2003, 2010, ['bmw_seria_6_e63']),
      G('F12/F13/F06', 2011, 2018, ['bmw_seria_6_f12']),
      G('G32 GT', 2017, 2024, ['bmw_seria_6_g32']),
    ]},
    { name: 'Seria 7', gens: [
      G('E65/E66', 2001, 2008, ['bmw_seria_7_e65']),
      G('F01/F02', 2008, 2015, ['bmw_seria_7_f01']),
      G('G11/G12', 2015, 2022, ['bmw_seria_7_g11']),
      G('G70', 2022, 2024, ['bmw_seria_7_g70']),
    ]},
    { name: 'Seria 8', gens: [
      G('G14/G15/G16', 2018, 2024, ['bmw_seria_8_g14']),
    ]},
    { name: 'X1', gens: [
      G('E84', 2009, 2015, ['bmw_x1_e84']),
      G('F48', 2015, 2022, ['bmw_x1_f48']),
      G('U11', 2022, 2024, ['bmw_x1_u11']),
    ]},
    { name: 'X2', gens: [
      G('F39', 2018, 2023, ['bmw_x2_f39']),
    ]},
    { name: 'X3', gens: [
      G('E83', 2003, 2010, ['bmw_x3_e83']),
      G('F25', 2010, 2017, ['bmw_x3_f25']),
      G('G01', 2017, 2024, ['bmw_x3_g01']),
    ]},
    { name: 'X4', gens: [
      G('F26', 2014, 2018, ['bmw_x4_f26']),
      G('G02', 2018, 2024, ['bmw_x4_g02']),
    ]},
    { name: 'X5', gens: [
      G('E70', 2006, 2013, ['bmw_x5_e70']),
      G('F15', 2013, 2018, ['bmw_x5_f15']),
      G('G05', 2018, 2024, ['bmw_x5_g05']),
    ]},
    { name: 'X6', gens: [
      G('E71', 2008, 2014, ['bmw_x6_e71']),
      G('F16', 2014, 2019, ['bmw_x6_f16']),
      G('G06', 2019, 2024, ['bmw_x6_g06']),
    ]},
    { name: 'X7', gens: [
      G('G07', 2018, 2024, ['bmw_x7_g07']),
    ]},
    { name: 'Z4', gens: [
      G('E89', 2009, 2016, ['bmw_z4_e89']),
      G('G29', 2018, 2024, ['bmw_z4_g29']),
    ]},
    // ---- Modele M (osobne wpisy) ----
    { name: 'M2', gens: [
      G('F87', 2016, 2021, ['bmw_m2_f87']),
      G('G87', 2023, 2024, ['bmw_m2_g87']),
    ]},
    { name: 'M3', gens: [
      G('E46', 2000, 2006, ['bmw_m3_e46']),
      G('E90/E92/E93', 2007, 2013, ['bmw_m3_e90']),
      G('F80', 2014, 2018, ['bmw_m3_f80']),
      G('G80', 2020, 2024, ['bmw_m3_g80']),
    ]},
    { name: 'M4', gens: [
      G('F82/F83', 2014, 2020, ['bmw_m4_f82']),
      G('G82/G83', 2020, 2024, ['bmw_m4_g82']),
    ]},
    { name: 'M5', gens: [
      G('E39', 1998, 2003, ['bmw_m5_e39']),
      G('E60/E61', 2005, 2010, ['bmw_m5_e60']),
      G('F10', 2011, 2017, ['bmw_m5_f10']),
      G('F90', 2017, 2023, ['bmw_m5_f90']),
      G('G90', 2024, 2024, ['bmw_m5_g90']),
    ]},
    { name: 'M6', gens: [
      G('F12/F13/F06', 2012, 2018, ['bmw_m6_f12']),
    ]},
    { name: 'M8', gens: [
      G('F91/F92/F93', 2019, 2024, ['bmw_m8_f91']),
    ]},
    { name: 'X3 M', gens: [
      G('F97', 2019, 2024, ['bmw_x3m_f97']),
    ]},
    { name: 'X4 M', gens: [
      G('F98', 2019, 2024, ['bmw_x4m_f98']),
    ]},
    { name: 'X5 M', gens: [
      G('E70', 2009, 2013, ['bmw_x5m_e70']),
      G('F85', 2014, 2018, ['bmw_x5m_f85']),
      G('F95', 2019, 2024, ['bmw_x5m_f95']),
    ]},
    { name: 'X6 M', gens: [
      G('E71', 2009, 2014, ['bmw_x6m_e71']),
      G('F86', 2014, 2019, ['bmw_x6m_f86']),
      G('F96', 2019, 2024, ['bmw_x6m_f96']),
    ]},
  ]},
  { key: 'mini', name: 'Mini', models: [
    { name: 'Cooper', gens: [G('R56', 2006, 2014, MINI_ALL), G('F56', 2014, 2024, MINI_ALL)] },
    { name: 'Clubman', gens: [G('R55', 2007, 2014, MINI_ALL), G('F54', 2015, 2024, MINI_ALL)] },
    { name: 'Countryman', gens: [G('R60', 2010, 2016, MINI_ALL), G('F60', 2017, 2024, MINI_ALL)] },
  ]},

  // ---------- Mercedes ----------
  { key: 'mercedes', name: 'Mercedes-Benz', models: [
    { name: 'Klasa A', silnikRe: /^(A [0-9]|AMG A[0-9])/, gens: [G('W169', 2004, 2012, MB_ALL), G('W176', 2012, 2018, MB_ALL), G('W177', 2018, 2024, MB_ALL)] },
    { name: 'Klasa B', silnikRe: /^B [0-9]/, gens: [G('W245', 2005, 2011, MB_ALL), G('W246', 2011, 2018, MB_ALL), G('W247', 2018, 2024, MB_ALL)] },
    { name: 'CLA', silnikRe: /^(CLA [0-9]|AMG CLA[0-9 ])/, gens: [G('C117', 2013, 2019, MB_ALL), G('C118', 2019, 2024, MB_ALL)] },
    { name: 'GLA', silnikRe: /^GLA [0-9]/, gens: [G('X156', 2014, 2020, MB_ALL), G('H247', 2020, 2024, MB_ALL)] },
    { name: 'Klasa C', silnikRe: /^(C [0-9]|AMG C[0-9])/, gens: [G('W203', 2000, 2007, MB_ALL), G('W204', 2007, 2014, MB_ALL), G('W205', 2014, 2021, MB_ALL), G('W206', 2021, 2024, MB_ALL)] },
    { name: 'CLK', silnikRe: /^CLK [0-9]/, gens: [G('W209', 2002, 2010, MB_ALL)] },
    { name: 'CLS', silnikRe: /^(CLS [0-9]|AMG CLS [0-9])/, gens: [G('W219', 2004, 2010, MB_ALL), G('W218', 2010, 2018, MB_ALL), G('W257', 2018, 2024, MB_ALL)] },
    { name: 'Klasa E', silnikRe: /^(E [0-9]|AMG E[0-9])/, gens: [G('W211', 2002, 2009, MB_ALL), G('W212', 2009, 2016, MB_ALL), G('W213', 2016, 2023, MB_ALL), G('W214', 2023, 2024, MB_ALL)] },
    { name: 'Klasa S', silnikRe: /^(S [0-9]|AMG S[0-9])/, gens: [G('W221', 2005, 2013, MB_ALL), G('W222', 2013, 2020, MB_ALL), G('W223', 2020, 2024, MB_ALL)] },
    { name: 'GLB', silnikRe: /^GLB [0-9]/, gens: [G('X247', 2019, 2024, MB_ALL)] },
    { name: 'GLC', silnikRe: /^(GLC [0-9]|AMG GLC [0-9])/, gens: [G('X253', 2015, 2022, MB_ALL), G('X254', 2022, 2024, MB_ALL)] },
    { name: 'GLE', silnikRe: /^(GLE [0-9]|AMG GLE [0-9])/, gens: [G('W166', 2015, 2018, MB_ALL), G('V167', 2018, 2024, MB_ALL)] },
    { name: 'GLS', silnikRe: /^(GLS [0-9]|AMG GLS [0-9])/, gens: [G('X166', 2015, 2019, MB_ALL), G('X167', 2019, 2024, MB_ALL)] },
    { name: 'ML', silnikRe: /^ML [0-9]/, gens: [G('W164', 2005, 2011, MB_ALL), G('W166', 2011, 2015, MB_ALL)] },
    { name: 'GL', silnikRe: /^GL [0-9]/, gens: [G('X164', 2006, 2012, MB_ALL), G('X166', 2012, 2015, MB_ALL)] },
    { name: 'Vito', silnikRe: /^Vito\s/, gens: [G('W639', 2003, 2014, ['mb_diesel']), G('W447', 2014, 2024, ['mb_diesel'])] },
    { name: 'Sprinter', silnikRe: /^Sprinter\s/, gens: [G('NCV3 (W906)', 2006, 2018, ['mb_diesel']), G('VS30 (W907)', 2018, 2024, ['mb_diesel'])] },
  ]},
  { key: 'smart', name: 'Smart', models: [
    { name: 'ForTwo', gens: [G('III (453)', 2014, 2024, ['smart_petrol_turbo'])] },
    { name: 'ForFour', gens: [G('II (453)', 2014, 2021, ['smart_petrol_turbo'])] },
  ]},

  // ---------- Ford ----------
  { key: 'ford', name: 'Ford', models: [
    { name: 'Fiesta', gens: [G('Mk6', 2002, 2008, FORD_ALL), G('Mk7', 2008, 2017, FORD_ALL), G('Mk8', 2017, 2023, FORD_ALL)] },
    { name: 'Focus', gens: [G('Mk1', 1998, 2004, FORD_ALL), G('Mk2', 2004, 2011, FORD_ALL), G('Mk3', 2010, 2018, FORD_ALL), G('Mk4', 2018, 2024, FORD_ALL)] },
    { name: 'C-Max', gens: [G('I', 2003, 2010, FORD_ALL), G('II', 2010, 2019, FORD_ALL)] },
    { name: 'Kuga', gens: [G('I', 2008, 2012, FORD_ALL), G('II', 2012, 2019, FORD_ALL), G('III', 2019, 2024, FORD_ALL)] },
    { name: 'Mondeo', gens: [G('Mk3', 2000, 2007, FORD_ALL), G('Mk4', 2007, 2014, FORD_ALL), G('Mk5', 2014, 2022, FORD_ALL)] },
    { name: 'S-Max', gens: [G('I', 2006, 2014, FORD_ALL), G('II', 2015, 2024, FORD_ALL)] },
    { name: 'Galaxy', gens: [G('III', 2006, 2015, FORD_ALL), G('IV', 2015, 2024, FORD_ALL)] },
    { name: 'EcoSport', gens: [G('II', 2013, 2024, FORD_ALL)] },
    { name: 'Edge', gens: [G('II', 2015, 2024, FORD_ALL)] },
    { name: 'Transit', gens: [G('Mk7', 2006, 2014, ['ford_diesel']), G('Mk8', 2014, 2024, ['ford_diesel'])] },
    { name: 'Transit Custom', gens: [G('I', 2012, 2024, ['ford_diesel'])] },
    { name: 'Connect', gens: [G('II', 2013, 2024, ['ford_diesel','ford_petrol_turbo'])] },
    { name: 'Ranger', gens: [G('T6', 2011, 2022, ['ford_diesel']), G('Next-Gen', 2022, 2024, ['ford_diesel'])] },
  ]},
  { key: 'jaguar', name: 'Jaguar', models: [
    { name: 'XE', gens: [G('I', 2015, 2024, JAG_ALL)] },
    { name: 'XF', gens: [G('I', 2008, 2015, JAG_ALL), G('II', 2015, 2024, JAG_ALL)] },
    { name: 'XJ', gens: [G('X351', 2009, 2019, JAG_ALL)] },
    { name: 'F-Pace', gens: [G('I', 2016, 2024, JAG_ALL)] },
    { name: 'E-Pace', gens: [G('I', 2017, 2024, JAG_ALL)] },
    { name: 'F-Type', gens: [G('I', 2013, 2024, ['jaguar_petrol_turbo'])] },
  ]},
  { key: 'landrover', name: 'Land Rover', models: [
    { name: 'Discovery', gens: [G('IV', 2009, 2016, LR_ALL), G('V', 2017, 2024, LR_ALL)] },
    { name: 'Discovery Sport', gens: [G('I', 2014, 2024, LR_ALL)] },
    { name: 'Range Rover', gens: [G('L322', 2002, 2012, LR_ALL), G('L405', 2012, 2021, LR_ALL), G('L460', 2021, 2024, LR_ALL)] },
    { name: 'Range Rover Sport', gens: [G('L320', 2005, 2013, LR_ALL), G('L494', 2013, 2022, LR_ALL), G('L461', 2022, 2024, LR_ALL)] },
    { name: 'Range Rover Evoque', gens: [G('I (L538)', 2011, 2018, LR_ALL), G('II (L551)', 2018, 2024, LR_ALL)] },
    { name: 'Range Rover Velar', gens: [G('I', 2017, 2024, LR_ALL)] },
    { name: 'Defender', gens: [G('L663', 2020, 2024, LR_ALL)] },
  ]},

  // ---------- PSA ----------
  { key: 'peugeot', name: 'Peugeot', models: [
    { name: '208', gens: [G('I', 2012, 2019, PSA_ALL), G('II', 2019, 2024, PSA_ALL)] },
    { name: '2008', gens: [G('I', 2013, 2019, PSA_ALL), G('II', 2019, 2024, PSA_ALL)] },
    { name: '301', gens: [G('I', 2012, 2024, PSA_ALL)] },
    { name: '308', gens: [G('I (T7)', 2007, 2014, PSA_ALL), G('II (T9)', 2013, 2021, PSA_ALL), G('III (P5)', 2021, 2024, PSA_ALL)] },
    { name: '3008', gens: [G('I', 2009, 2016, PSA_ALL), G('II', 2016, 2024, PSA_ALL)] },
    { name: '407', gens: [G('I', 2004, 2010, PSA_ALL)] },
    { name: '5008', gens: [G('I', 2009, 2017, PSA_ALL), G('II', 2017, 2024, PSA_ALL)] },
    { name: '508', gens: [G('I', 2010, 2018, PSA_ALL), G('II', 2018, 2024, PSA_ALL)] },
    { name: 'Partner', gens: [G('II', 2008, 2018, ['psa_diesel','psa_petrol_na']), G('III', 2018, 2024, ['psa_diesel','psa_petrol_turbo'])] },
    { name: 'Expert', gens: [G('II', 2007, 2016, ['psa_diesel']), G('III', 2016, 2024, ['psa_diesel'])] },
    { name: 'Boxer', gens: [G('III', 2006, 2024, ['psa_diesel'])] },
    { name: 'RCZ', gens: [G('I', 2010, 2015, ['psa_petrol_turbo'])] },
  ]},
  { key: 'citroen', name: 'Citroen', models: [
    { name: 'C3', gens: [G('II', 2009, 2016, PSA_ALL), G('III', 2016, 2024, PSA_ALL)] },
    { name: 'C4', gens: [G('I', 2004, 2010, PSA_ALL), G('II', 2010, 2018, PSA_ALL), G('III', 2020, 2024, PSA_ALL)] },
    { name: 'C4 Picasso', gens: [G('I', 2006, 2013, PSA_ALL), G('II', 2013, 2018, PSA_ALL)] },
    { name: 'C5', gens: [G('II', 2008, 2017, PSA_ALL)] },
    { name: 'C5 Aircross', gens: [G('I', 2018, 2024, PSA_ALL)] },
    { name: 'Berlingo', gens: [G('II', 2008, 2018, ['psa_diesel','psa_petrol_na']), G('III', 2018, 2024, ['psa_diesel','psa_petrol_turbo'])] },
    { name: 'Jumpy', gens: [G('II', 2007, 2016, ['psa_diesel']), G('III', 2016, 2024, ['psa_diesel'])] },
    { name: 'Jumper', gens: [G('III', 2006, 2024, ['psa_diesel'])] },
    { name: 'DS3', gens: [G('I', 2009, 2019, PSA_ALL)] },
    { name: 'DS4', gens: [G('I', 2011, 2018, PSA_ALL)] },
    { name: 'DS5', gens: [G('I', 2011, 2018, PSA_ALL)] },
  ]},
  { key: 'ds', name: 'DS', models: [
    { name: 'DS3', gens: [G('Crossback', 2018, 2024, PSA_ALL)] },
    { name: 'DS4', gens: [G('II', 2021, 2024, PSA_ALL)] },
    { name: 'DS7', gens: [G('Crossback', 2017, 2024, PSA_ALL)] },
    { name: 'DS9', gens: [G('I', 2020, 2024, PSA_ALL)] },
  ]},

  // ---------- Renault ----------
  { key: 'renault', name: 'Renault', models: [
    { name: 'Clio', gens: [G('III', 2005, 2014, REN_ALL), G('IV', 2012, 2019, REN_ALL), G('V', 2019, 2024, REN_ALL)] },
    { name: 'Captur', gens: [G('I', 2013, 2019, REN_ALL), G('II', 2019, 2024, REN_ALL)] },
    { name: 'Megane', gens: [G('II', 2002, 2009, REN_ALL), G('III', 2008, 2016, REN_ALL), G('IV', 2015, 2024, REN_ALL)] },
    { name: 'Scenic', gens: [G('II', 2003, 2009, REN_ALL), G('III', 2009, 2016, REN_ALL), G('IV', 2016, 2022, REN_ALL)] },
    { name: 'Kadjar', gens: [G('I', 2015, 2022, REN_ALL)] },
    { name: 'Koleos', gens: [G('I', 2008, 2016, REN_ALL), G('II', 2016, 2024, REN_ALL)] },
    { name: 'Laguna', gens: [G('II', 2001, 2007, REN_ALL), G('III', 2007, 2015, REN_ALL)] },
    { name: 'Talisman', gens: [G('I', 2015, 2022, REN_ALL)] },
    { name: 'Espace', gens: [G('IV', 2002, 2014, REN_ALL), G('V', 2015, 2022, REN_ALL)] },
    { name: 'Trafic', gens: [G('II', 2001, 2014, ['renault_diesel']), G('III', 2014, 2024, ['renault_diesel'])] },
    { name: 'Master', gens: [G('II', 1997, 2010, ['renault_diesel']), G('III', 2010, 2024, ['renault_diesel'])] },
    { name: 'Kangoo', gens: [G('II', 2008, 2021, ['renault_diesel','renault_petrol_na']), G('III', 2021, 2024, ['renault_diesel','renault_petrol_turbo'])] },
  ]},
  { key: 'dacia', name: 'Dacia', models: [
    { name: 'Logan', gens: [G('I', 2004, 2012, DAC_ALL), G('II', 2012, 2020, DAC_ALL), G('III', 2020, 2024, DAC_ALL)] },
    { name: 'Sandero', gens: [G('I', 2008, 2012, DAC_ALL), G('II', 2012, 2020, DAC_ALL), G('III', 2020, 2024, DAC_ALL)] },
    { name: 'Duster', gens: [G('I', 2010, 2017, DAC_ALL), G('II', 2017, 2024, DAC_ALL)] },
    { name: 'Lodgy', gens: [G('I', 2012, 2022, DAC_ALL)] },
    { name: 'Dokker', gens: [G('I', 2012, 2021, DAC_ALL)] },
    { name: 'Jogger', gens: [G('I', 2022, 2024, DAC_ALL)] },
    { name: 'Spring', gens: [G('I', 2021, 2024, ['dacia_petrol_na'])] },
  ]},

  // ---------- Stellantis (Fiat/Alfa/Lancia/Jeep/Chrysler/Dodge) ----------
  { key: 'fiat', name: 'Fiat', models: [
    { name: '500', gens: [G('II', 2007, 2024, FIAT_ALL)] },
    { name: '500X', gens: [G('I', 2014, 2024, FIAT_ALL)] },
    { name: '500L', gens: [G('I', 2012, 2022, FIAT_ALL)] },
    { name: 'Panda', gens: [G('II', 2003, 2012, FIAT_ALL), G('III', 2011, 2024, FIAT_ALL)] },
    { name: 'Punto', gens: [G('II', 1999, 2012, FIAT_ALL), G('Grande Punto/Evo', 2005, 2018, FIAT_ALL)] },
    { name: 'Tipo', gens: [G('356', 2015, 2024, FIAT_ALL)] },
    { name: 'Bravo', gens: [G('II', 2007, 2014, FIAT_ALL)] },
    { name: 'Doblo', gens: [G('II', 2010, 2022, FIAT_ALL)] },
    { name: 'Ducato', gens: [G('III', 2006, 2024, ['fiat_diesel'])] },
    { name: 'Stilo', gens: [G('I', 2001, 2007, FIAT_ALL)] },
    { name: 'Croma', gens: [G('II', 2005, 2010, FIAT_ALL)] },
  ]},
  { key: 'alfa', name: 'Alfa Romeo', models: [
    { name: '147', gens: [G('I', 2000, 2010, ALFA_ALL)] },
    { name: '156', gens: [G('I', 1997, 2007, ALFA_ALL)] },
    { name: '159', gens: [G('I', 2005, 2011, ALFA_ALL)] },
    { name: 'Brera', gens: [G('I', 2005, 2010, ALFA_ALL)] },
    { name: 'Spider', gens: [G('939', 2006, 2010, ALFA_ALL)] },
    { name: 'Mito', gens: [G('I', 2008, 2018, ALFA_ALL)] },
    { name: 'Giulietta', gens: [G('I (940)', 2010, 2020, ALFA_ALL)] },
    { name: 'Giulia', gens: [G('I (952)', 2015, 2024, ALFA_ALL)] },
    { name: 'Stelvio', gens: [G('I', 2017, 2024, ALFA_ALL)] },
    { name: 'Tonale', gens: [G('I', 2022, 2024, ALFA_ALL)] },
  ]},
  { key: 'lancia', name: 'Lancia', models: [
    { name: 'Ypsilon', gens: [G('II', 2003, 2011, LANCIA_ALL), G('III', 2011, 2024, LANCIA_ALL)] },
    { name: 'Delta', gens: [G('III', 2008, 2014, LANCIA_ALL)] },
    { name: 'Musa', gens: [G('I', 2004, 2012, LANCIA_ALL)] },
    { name: 'Thesis', gens: [G('I', 2002, 2009, LANCIA_ALL)] },
  ]},
  { key: 'jeep', name: 'Jeep', models: [
    { name: 'Renegade', gens: [G('I (BU)', 2014, 2024, JEEP_ALL)] },
    { name: 'Compass', gens: [G('II (MP)', 2017, 2024, JEEP_ALL)] },
    { name: 'Cherokee', gens: [G('KL', 2014, 2023, JEEP_ALL)] },
    { name: 'Grand Cherokee', gens: [G('WK2', 2010, 2021, JEEP_ALL), G('WL', 2021, 2024, JEEP_ALL)] },
    { name: 'Wrangler', gens: [G('JK', 2007, 2018, JEEP_ALL), G('JL', 2018, 2024, JEEP_ALL)] },
    { name: 'Avenger', gens: [G('I', 2023, 2024, ['jeep_petrol_turbo'])] },
  ]},
  { key: 'chrysler', name: 'Chrysler', models: [
    { name: '300C', gens: [G('I', 2004, 2010, CHRY_ALL), G('II', 2011, 2023, CHRY_ALL)] },
    { name: 'Voyager', gens: [G('IV', 2001, 2008, CHRY_ALL), G('V', 2008, 2016, CHRY_ALL)] },
  ]},
  { key: 'dodge', name: 'Dodge', models: [
    { name: 'Challenger', gens: [G('III', 2008, 2023, DODGE_ALL)] },
    { name: 'Charger', gens: [G('VII', 2011, 2023, DODGE_ALL)] },
    { name: 'Durango', gens: [G('III', 2011, 2024, DODGE_ALL)] },
  ]},

  // ---------- Hyundai/Kia ----------
  { key: 'hyundai', name: 'Hyundai', models: [
    { name: 'i10', gens: [G('II', 2013, 2019, ['hyundai_petrol_na']), G('III', 2019, 2024, ['hyundai_petrol_na'])] },
    { name: 'i20', gens: [G('I (PB)', 2008, 2014, HYU_ALL), G('II (GB)', 2014, 2020, HYU_ALL), G('III (BC3)', 2020, 2024, HYU_ALL)] },
    { name: 'i30', gens: [G('I (FD)', 2007, 2012, HYU_ALL), G('II (GD)', 2011, 2017, HYU_ALL), G('III (PD)', 2017, 2024, HYU_ALL)] },
    { name: 'i40', gens: [G('I (VF)', 2011, 2019, HYU_ALL)] },
    { name: 'Ix20', gens: [G('I (JC)', 2010, 2019, HYU_ALL)] },
    { name: 'Ix35', gens: [G('I (LM)', 2010, 2015, HYU_ALL)] },
    { name: 'Tucson', gens: [G('II (LM)', 2010, 2015, HYU_ALL), G('III (TL)', 2015, 2020, HYU_ALL), G('IV (NX4)', 2020, 2024, HYU_ALL)] },
    { name: 'Santa Fe', gens: [G('II (CM)', 2006, 2012, HYU_ALL), G('III (DM)', 2012, 2018, HYU_ALL), G('IV (TM)', 2018, 2024, HYU_ALL)] },
    { name: 'Kona', gens: [G('I (OS)', 2017, 2023, HYU_ALL), G('II (SX2)', 2023, 2024, HYU_ALL)] },
    { name: 'Elantra', gens: [G('VI (AD)', 2015, 2020, HYU_ALL), G('VII (CN7)', 2020, 2024, HYU_ALL)] },
    { name: 'H1', gens: [G('II (TQ)', 2007, 2021, ['hyundai_diesel'])] },
  ]},
  { key: 'kia', name: 'Kia', models: [
    { name: 'Picanto', gens: [G('II (TA)', 2011, 2017, ['kia_petrol_na']), G('III (JA)', 2017, 2024, ['kia_petrol_na'])] },
    { name: 'Rio', gens: [G('III (UB)', 2011, 2017, KIA_ALL), G('IV (YB)', 2017, 2024, KIA_ALL)] },
    { name: 'Cee\'d', gens: [G('I (ED)', 2007, 2012, KIA_ALL), G('II (JD)', 2012, 2018, KIA_ALL), G('III (CD)', 2018, 2024, KIA_ALL)] },
    { name: 'Stonic', gens: [G('I (YB)', 2017, 2024, KIA_ALL)] },
    { name: 'Soul', gens: [G('II (PS)', 2014, 2019, KIA_ALL), G('III (SK3)', 2019, 2024, KIA_ALL)] },
    { name: 'Sportage', gens: [G('III (SL)', 2010, 2015, KIA_ALL), G('IV (QL)', 2015, 2021, KIA_ALL), G('V (NQ5)', 2021, 2024, KIA_ALL)] },
    { name: 'Sorento', gens: [G('II (XM)', 2009, 2014, KIA_ALL), G('III (UM)', 2014, 2020, KIA_ALL), G('IV (MQ4)', 2020, 2024, KIA_ALL)] },
    { name: 'Optima', gens: [G('III (TF)', 2010, 2015, KIA_ALL), G('IV (JF)', 2015, 2020, KIA_ALL)] },
    { name: 'Stinger', gens: [G('I (CK)', 2017, 2023, KIA_ALL)] },
    { name: 'Carens', gens: [G('III (UN)', 2006, 2013, KIA_ALL)] },
  ]},

  // ---------- Toyota / Mazda / Honda / Subaru / Mitsubishi / Suzuki / Nissan ----------
  { key: 'toyota', name: 'Toyota', models: [
    { name: 'Aygo', gens: [G('II (AB40)', 2014, 2022, ['toyota_petrol_na'])] },
    { name: 'Yaris', gens: [G('II (XP90)', 2005, 2011, TOY_ALL), G('III (XP130)', 2011, 2020, TOY_ALL), G('IV (XP210)', 2020, 2024, TOY_ALL)] },
    { name: 'Auris', gens: [G('I (E150)', 2006, 2012, TOY_ALL), G('II (E180)', 2012, 2018, TOY_ALL)] },
    { name: 'Corolla', gens: [G('XI (E170)', 2013, 2019, TOY_ALL), G('XII (E210)', 2018, 2024, TOY_ALL)] },
    { name: 'Avensis', gens: [G('II (T250)', 2003, 2009, TOY_ALL), G('III (T270)', 2009, 2018, TOY_ALL)] },
    { name: 'Camry', gens: [G('XI (XV70)', 2017, 2024, TOY_ALL)] },
    { name: 'C-HR', gens: [G('I', 2016, 2024, TOY_ALL)] },
    { name: 'RAV4', gens: [G('III (XA30)', 2005, 2012, TOY_ALL), G('IV (XA40)', 2012, 2018, TOY_ALL), G('V (XA50)', 2018, 2024, TOY_ALL)] },
    { name: 'Land Cruiser', gens: [G('150 (J15)', 2009, 2024, ['toyota_diesel'])] },
    { name: 'Hilux', gens: [G('VII', 2004, 2015, ['toyota_diesel']), G('VIII', 2015, 2024, ['toyota_diesel'])] },
    { name: 'Proace', gens: [G('II', 2016, 2024, ['toyota_diesel'])] },
  ]},
  { key: 'mazda', name: 'Mazda', models: [
    { name: 'Mazda 2', gens: [G('III (DJ)', 2014, 2024, MAZDA_ALL)] },
    { name: 'Mazda 3', gens: [G('I (BK)', 2003, 2009, MAZDA_ALL), G('II (BL)', 2009, 2014, MAZDA_ALL), G('III (BM)', 2013, 2019, MAZDA_ALL), G('IV (BP)', 2019, 2024, MAZDA_ALL)] },
    { name: 'Mazda 6', gens: [G('I (GG)', 2002, 2008, MAZDA_ALL), G('II (GH)', 2007, 2013, MAZDA_ALL), G('III (GJ)', 2012, 2024, MAZDA_ALL)] },
    { name: 'CX-3', gens: [G('I', 2015, 2022, MAZDA_ALL)] },
    { name: 'CX-30', gens: [G('I', 2019, 2024, MAZDA_ALL)] },
    { name: 'CX-5', gens: [G('I (KE)', 2012, 2017, MAZDA_ALL), G('II (KF)', 2017, 2024, MAZDA_ALL)] },
    { name: 'CX-60', gens: [G('I', 2022, 2024, MAZDA_ALL)] },
    { name: 'MX-5', gens: [G('III (NC)', 2005, 2015, ['mazda_petrol_na']), G('IV (ND)', 2015, 2024, ['mazda_petrol_na'])] },
  ]},
  { key: 'honda', name: 'Honda', models: [
    { name: 'Jazz', gens: [G('II (GE)', 2008, 2014, ['honda_petrol_na']), G('III (GK)', 2014, 2020, ['honda_petrol_na']), G('IV (GR)', 2020, 2024, ['honda_petrol_na'])] },
    { name: 'Civic', gens: [G('VIII', 2005, 2012, HONDA_ALL), G('IX', 2011, 2017, HONDA_ALL), G('X', 2015, 2022, HONDA_ALL), G('XI', 2021, 2024, HONDA_ALL)] },
    { name: 'Accord', gens: [G('VIII', 2008, 2015, HONDA_ALL)] },
    { name: 'CR-V', gens: [G('III', 2006, 2012, HONDA_ALL), G('IV', 2012, 2018, HONDA_ALL), G('V', 2018, 2023, HONDA_ALL), G('VI', 2023, 2024, HONDA_ALL)] },
    { name: 'HR-V', gens: [G('II (RU)', 2015, 2021, HONDA_ALL), G('III (RV)', 2021, 2024, HONDA_ALL)] },
  ]},
  { key: 'subaru', name: 'Subaru', models: [
    { name: 'Impreza', gens: [G('III (GE/GH)', 2007, 2011, SUB_ALL), G('IV (GP/GJ)', 2011, 2016, SUB_ALL), G('V (GK/GT)', 2016, 2024, SUB_ALL)] },
    { name: 'Forester', gens: [G('III (SH)', 2008, 2013, SUB_ALL), G('IV (SJ)', 2012, 2018, SUB_ALL), G('V (SK)', 2018, 2024, SUB_ALL)] },
    { name: 'Outback', gens: [G('IV (BR)', 2009, 2014, SUB_ALL), G('V (BS)', 2014, 2020, SUB_ALL), G('VI (BT)', 2020, 2024, SUB_ALL)] },
    { name: 'XV', gens: [G('I (GP)', 2012, 2017, SUB_ALL), G('II (GT)', 2017, 2023, SUB_ALL)] },
    { name: 'WRX', gens: [G('IV', 2014, 2020, ['subaru_petrol_turbo']), G('V', 2021, 2024, ['subaru_petrol_turbo'])] },
  ]},
  { key: 'mitsubishi', name: 'Mitsubishi', models: [
    { name: 'Colt', gens: [G('VI', 2002, 2012, MIT_ALL)] },
    { name: 'Lancer', gens: [G('IX', 2003, 2010, MIT_ALL), G('X', 2007, 2017, MIT_ALL)] },
    { name: 'Outlander', gens: [G('II', 2006, 2012, MIT_ALL), G('III', 2012, 2021, MIT_ALL)] },
    { name: 'ASX', gens: [G('I', 2010, 2023, MIT_ALL)] },
    { name: 'Eclipse Cross', gens: [G('I', 2017, 2024, MIT_ALL)] },
    { name: 'L200', gens: [G('IV', 2005, 2015, ['mitsubishi_diesel']), G('V', 2015, 2024, ['mitsubishi_diesel'])] },
    { name: 'Pajero', gens: [G('IV (V80)', 2006, 2021, ['mitsubishi_diesel'])] },
    { name: 'Pajero Sport', gens: [G('III', 2015, 2024, ['mitsubishi_diesel'])] },
  ]},
  { key: 'suzuki', name: 'Suzuki', models: [
    { name: 'Swift', gens: [G('II (RS)', 2004, 2010, SUZ_ALL), G('III (FZ)', 2010, 2017, SUZ_ALL), G('IV (AZ)', 2017, 2024, SUZ_ALL)] },
    { name: 'SX4', gens: [G('I', 2006, 2014, SUZ_ALL), G('II S-Cross', 2013, 2021, SUZ_ALL)] },
    { name: 'Vitara', gens: [G('III', 1998, 2005, SUZ_ALL), G('IV (LY)', 2015, 2024, SUZ_ALL)] },
    { name: 'Grand Vitara', gens: [G('II', 2005, 2015, SUZ_ALL)] },
    { name: 'Jimny', gens: [G('III', 1998, 2018, ['suzuki_petrol_na']), G('IV', 2018, 2024, ['suzuki_petrol_na'])] },
    { name: 'Ignis', gens: [G('II', 2016, 2024, SUZ_ALL)] },
  ]},
  { key: 'nissan', name: 'Nissan', models: [
    { name: 'Micra', gens: [G('IV (K13)', 2010, 2017, NISSAN_ALL), G('V (K14)', 2017, 2023, NISSAN_ALL)] },
    { name: 'Note', gens: [G('II (E12)', 2013, 2020, NISSAN_ALL)] },
    { name: 'Juke', gens: [G('I (F15)', 2010, 2019, NISSAN_ALL), G('II (F16)', 2019, 2024, NISSAN_ALL)] },
    { name: 'Qashqai', gens: [G('I (J10)', 2007, 2013, NISSAN_ALL), G('II (J11)', 2013, 2021, NISSAN_ALL), G('III (J12)', 2021, 2024, NISSAN_ALL)] },
    { name: 'X-Trail', gens: [G('II (T31)', 2007, 2014, NISSAN_ALL), G('III (T32)', 2014, 2022, NISSAN_ALL), G('IV (T33)', 2022, 2024, NISSAN_ALL)] },
    { name: 'Murano', gens: [G('II (Z51)', 2008, 2014, NISSAN_ALL)] },
    { name: 'Pathfinder', gens: [G('IV (R52)', 2012, 2021, NISSAN_ALL)] },
    { name: 'Navara', gens: [G('III (D40)', 2004, 2015, ['nissan_diesel']), G('IV (D23)', 2015, 2024, ['nissan_diesel'])] },
    { name: 'NV200', gens: [G('I', 2009, 2021, ['nissan_diesel'])] },
    { name: 'GT-R', gens: [G('R35', 2007, 2024, ['nissan_petrol_turbo'])] },
    { name: '370Z', gens: [G('Z34', 2009, 2020, ['nissan_petrol_na'])] },
  ]},

  // ---------- Volvo ----------
  { key: 'volvo', name: 'Volvo', models: [
    { name: 'V40', gens: [G('II (M)', 2012, 2019, VOLVO_ALL)] },
    { name: 'V60', gens: [G('I', 2010, 2018, VOLVO_ALL), G('II', 2018, 2024, VOLVO_ALL)] },
    { name: 'V70', gens: [G('III', 2007, 2016, VOLVO_ALL)] },
    { name: 'V90', gens: [G('II', 2016, 2024, VOLVO_ALL)] },
    { name: 'S60', gens: [G('II', 2010, 2018, VOLVO_ALL), G('III', 2018, 2024, VOLVO_ALL)] },
    { name: 'S80', gens: [G('II', 2006, 2016, VOLVO_ALL)] },
    { name: 'S90', gens: [G('II', 2016, 2024, VOLVO_ALL)] },
    { name: 'XC40', gens: [G('I', 2017, 2024, VOLVO_ALL)] },
    { name: 'XC60', gens: [G('I', 2008, 2017, VOLVO_ALL), G('II', 2017, 2024, VOLVO_ALL)] },
    { name: 'XC70', gens: [G('III', 2007, 2016, VOLVO_ALL)] },
    { name: 'XC90', gens: [G('I', 2002, 2014, VOLVO_ALL), G('II', 2014, 2024, VOLVO_ALL)] },
  ]},

  // ---------- Inne ----------
  { key: 'saab', name: 'Saab', models: [
    { name: '9-3', gens: [G('II', 2002, 2014, ['saab_petrol_turbo'])] },
    { name: '9-5', gens: [G('I', 1997, 2010, ['saab_petrol_turbo']), G('II', 2010, 2012, ['saab_petrol_turbo'])] },
  ]},
  { key: 'iveco', name: 'Iveco', models: [
    { name: 'Daily', gens: [G('IV', 2006, 2011, ['iveco_diesel']), G('V', 2011, 2014, ['iveco_diesel']), G('VI', 2014, 2019, ['iveco_diesel']), G('VI MY19', 2019, 2024, ['iveco_diesel'])] },
  ]},
  { key: 'ssang', name: 'SsangYong', models: [
    { name: 'Korando', gens: [G('III (C200)', 2010, 2019, SSANG_ALL), G('IV (C300)', 2019, 2024, SSANG_ALL)] },
    { name: 'Tivoli', gens: [G('I (X100)', 2015, 2024, SSANG_ALL)] },
    { name: 'Rexton', gens: [G('II', 2006, 2017, SSANG_ALL), G('III (Y400)', 2017, 2024, SSANG_ALL)] },
  ]},
  { key: 'chevrolet', name: 'Chevrolet', models: [
    { name: 'Cruze', gens: [G('I (J300)', 2008, 2016, CHEV_ALL)] },
    { name: 'Aveo', gens: [G('II (T300)', 2011, 2020, CHEV_ALL)] },
    { name: 'Captiva', gens: [G('I (C100)', 2006, 2018, CHEV_ALL)] },
    { name: 'Orlando', gens: [G('I', 2010, 2018, CHEV_ALL)] },
    { name: 'Camaro', gens: [G('VI', 2015, 2024, ['chevrolet_petrol_turbo','chevrolet_petrol_na'])] },
    { name: 'Corvette', gens: [G('C7', 2013, 2019, ['chevrolet_petrol_na','chevrolet_petrol_turbo']), G('C8', 2019, 2024, ['chevrolet_petrol_na'])] },
  ]},
  { key: 'cadillac', name: 'Cadillac', models: [
    { name: 'CTS', gens: [G('III', 2013, 2019, CAD_ALL)] },
    { name: 'ATS', gens: [G('I', 2012, 2019, CAD_ALL)] },
    { name: 'Escalade', gens: [G('IV', 2014, 2020, CAD_ALL), G('V', 2020, 2024, CAD_ALL)] },
  ]},

  // ---------- Opel (post-PSA mapowane na pule PSA, klasyczne na własne) ----------
  { key: 'opel', name: 'Opel', models: [
    { name: 'Corsa', gens: [G('D', 2006, 2014, PSA_ALL), G('E', 2014, 2019, PSA_ALL), G('F', 2019, 2024, PSA_ALL)] },
    { name: 'Adam', gens: [G('I', 2012, 2019, PSA_ALL)] },
    { name: 'Astra', gens: [G('H', 2004, 2014, PSA_ALL), G('J', 2009, 2015, PSA_ALL), G('K', 2015, 2021, PSA_ALL), G('L', 2021, 2024, PSA_ALL)] },
    { name: 'Cascada', gens: [G('I', 2013, 2019, PSA_ALL)] },
    { name: 'Insignia', gens: [G('A', 2008, 2017, PSA_ALL), G('B', 2017, 2022, PSA_ALL)] },
    { name: 'Meriva', gens: [G('B', 2010, 2017, PSA_ALL)] },
    { name: 'Zafira', gens: [G('B', 2005, 2014, PSA_ALL), G('C Tourer', 2011, 2019, PSA_ALL)] },
    { name: 'Crossland', gens: [G('I (X)', 2017, 2024, PSA_ALL)] },
    { name: 'Mokka', gens: [G('I', 2012, 2019, PSA_ALL), G('II', 2020, 2024, PSA_ALL)] },
    { name: 'Grandland', gens: [G('I (X)', 2017, 2024, PSA_ALL)] },
    { name: 'Antara', gens: [G('I', 2006, 2015, PSA_ALL)] },
    { name: 'Combo', gens: [G('D', 2011, 2018, ['psa_diesel','psa_petrol_na']), G('E', 2018, 2024, ['psa_diesel','psa_petrol_turbo'])] },
    { name: 'Vivaro', gens: [G('B', 2014, 2019, ['renault_diesel']), G('C', 2019, 2024, ['psa_diesel'])] },
    { name: 'Movano', gens: [G('B', 2010, 2021, ['renault_diesel']), G('C', 2021, 2024, ['psa_diesel'])] },
  ]},

  // ---------- Lexus (silniki Toyoty) ----------
  { key: 'lexus', name: 'Lexus', models: [
    { name: 'CT', gens: [G('I (200h)', 2010, 2020, TOY_ALL)] },
    { name: 'IS', gens: [G('II (XE20)', 2005, 2013, TOY_ALL), G('III (XE30)', 2013, 2024, TOY_ALL)] },
    { name: 'ES', gens: [G('VII (XZ10)', 2018, 2024, TOY_ALL)] },
    { name: 'GS', gens: [G('IV (L10)', 2011, 2020, TOY_ALL)] },
    { name: 'LS', gens: [G('V (XF50)', 2017, 2024, TOY_ALL)] },
    { name: 'NX', gens: [G('I (AZ10)', 2014, 2021, TOY_ALL), G('II (AZ20)', 2021, 2024, TOY_ALL)] },
    { name: 'RX', gens: [G('III (AL10)', 2008, 2015, TOY_ALL), G('IV (AL20)', 2015, 2022, TOY_ALL), G('V (AL30)', 2022, 2024, TOY_ALL)] },
    { name: 'UX', gens: [G('I (MZAA10)', 2018, 2024, TOY_ALL)] },
    { name: 'LX', gens: [G('III (J200)', 2007, 2021, ['toyota_diesel'])] },
    { name: 'RC', gens: [G('I', 2014, 2024, TOY_ALL)] },
    { name: 'GX', gens: [G('II (J150)', 2009, 2023, ['toyota_diesel'])] },
  ]},

  // ---------- Genesis (silniki Hyundai/Kia) ----------
  { key: 'genesis', name: 'Genesis', models: [
    { name: 'G70', gens: [G('I', 2017, 2024, HYU_ALL)] },
    { name: 'G80', gens: [G('I (DH)', 2014, 2020, HYU_ALL), G('II (RG3)', 2020, 2024, HYU_ALL)] },
    { name: 'G90', gens: [G('I (HI)', 2015, 2022, HYU_ALL)] },
    { name: 'GV70', gens: [G('I', 2020, 2024, HYU_ALL)] },
    { name: 'GV80', gens: [G('I', 2020, 2024, HYU_ALL)] },
  ]},

  // ---------- Infiniti (silniki Nissana) ----------
  { key: 'infiniti', name: 'Infiniti', models: [
    { name: 'Q30', gens: [G('I', 2015, 2019, MB_ALL)] },
    { name: 'QX30', gens: [G('I', 2016, 2019, MB_ALL)] },
    { name: 'Q50', gens: [G('I (V37)', 2013, 2024, NISSAN_ALL)] },
    { name: 'Q60', gens: [G('II (CV37)', 2016, 2022, NISSAN_ALL)] },
    { name: 'Q70', gens: [G('I (Y51)', 2013, 2019, NISSAN_ALL)] },
    { name: 'QX50', gens: [G('II', 2017, 2024, NISSAN_ALL)] },
    { name: 'QX70', gens: [G('I (S51)', 2013, 2017, NISSAN_ALL)] },
    { name: 'QX80', gens: [G('I', 2014, 2024, ['nissan_petrol_turbo'])] },
  ]},

  // ---------- Cupra (na pulach VAG) ----------
  { key: 'cupra', name: 'Cupra', models: [
    { name: 'Leon', gens: [G('III', 2018, 2020, VAG_ALL), G('IV', 2020, 2024, VAG_ALL)] },
    { name: 'Ateca', gens: [G('I', 2018, 2024, VAG_ALL)] },
    { name: 'Formentor', gens: [G('I', 2020, 2024, VAG_ALL)] },
  ]},

  // ---------- Bentley (silniki VAG dużej mocy) ----------
  { key: 'bentley', name: 'Bentley', models: [
    { name: 'Continental GT', gens: [G('II', 2011, 2018, ['vag_petrol_turbo']), G('III', 2018, 2024, ['vag_petrol_turbo'])] },
    { name: 'Bentayga', gens: [G('I', 2015, 2024, VAG_ALL)] },
    { name: 'Flying Spur', gens: [G('II', 2013, 2019, ['vag_petrol_turbo']), G('III', 2019, 2024, ['vag_petrol_turbo'])] },
  ]},

  // ---------- Maserati ----------
  { key: 'maserati', name: 'Maserati', models: [
    { name: 'Ghibli', gens: [G('III (M157)', 2013, 2024, ['fiat_diesel','vag_petrol_turbo'])] },
    { name: 'Quattroporte', gens: [G('VI (M156)', 2013, 2024, ['fiat_diesel','vag_petrol_turbo'])] },
    { name: 'Levante', gens: [G('I (M161)', 2016, 2024, ['fiat_diesel','vag_petrol_turbo'])] },
    { name: 'Grecale', gens: [G('I', 2022, 2024, ['vag_petrol_turbo'])] },
  ]},
];

// Dodatkowe silniki podpinane w post-procesie do najpopularniejszych pul, żeby
// docelowy katalog liczył ~20 000+ pozycji bez sztucznego dublowania nadwozi.
// Patrz lib/synthetic-catalog.js (POOL_AUGMENT).
