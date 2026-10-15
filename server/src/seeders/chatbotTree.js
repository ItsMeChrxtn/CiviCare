/**
 * Bilingual (English / Tagalog) Q&A tree shared by the CiviCare Assistant and the FAQ page.
 * Top-level entries are the Assistant's topic buttons; `children` are the follow-up buttons.
 * Used by the seeder and by the one-time startup migration in bootstrap.service.js.
 */
const CHATBOT_TREE = [
  {
    label: 'Barangay Clearance',
    labelTl: 'Barangay Clearance',
    response: 'What would you like to know about the Barangay Clearance?',
    responseTl: 'Ano ang gusto mong malaman tungkol sa Barangay Clearance?',
    children: [
      {
        label: 'Requirements',
        labelTl: 'Mga Kailangan',
        response:
          'Requirements: (1) one valid government-issued ID, (2) proof of residency in Barangay Magdiwang, (3) the purpose of the request. First-time requesters not yet in the Records of Barangay Inhabitants (RBI) must visit the Barangay Hall for the Data Capture Form and picture taking.',
        responseTl:
          'Mga kailangan: (1) isang valid na government ID, (2) patunay na nakatira ka sa Barangay Magdiwang, (3) ang layunin ng request. Ang mga first-time na hindi pa nakatala sa Records of Barangay Inhabitants (RBI) ay kailangang pumunta sa Barangay Hall para sa Data Capture Form at picture taking.',
      },
      {
        label: 'How to request',
        labelTl: 'Paano mag-request',
        response:
          'Go to Service Request, tick "Barangay Clearance", fill in your personal details and purpose, then press Submit. You will receive an SMS once it is ready for pick-up.',
        responseTl:
          'Pumunta sa Service Request, i-check ang "Barangay Clearance", ilagay ang iyong personal na detalye at layunin, saka pindutin ang Submit. Makakatanggap ka ng SMS kapag handa na itong kunin.',
      },
      {
        label: 'Fee & processing time',
        labelTl: 'Bayad at tagal ng proseso',
        response: 'The Barangay Clearance is free of charge. Processing takes 1-2 working days, during office hours only.',
        responseTl: 'Libre ang Barangay Clearance. Ang proseso ay 1-2 araw ng trabaho, tuwing office hours lamang.',
      },
    ],
  },
  {
    label: 'Certificate of Indigency',
    labelTl: 'Certificate of Indigency',
    response:
      'For residents applying for financial, medical, or legal assistance. Free of charge. Requirements: one valid ID and the purpose of the request. Request it under Service Request.',
    responseTl:
      'Para sa mga residenteng humihingi ng tulong pinansyal, medikal, o legal. Libre ito. Kailangan: isang valid ID at ang layunin ng request. I-request ito sa Service Request.',
  },
  {
    label: 'Business Permit',
    labelTl: 'Business Permit',
    response:
      'Business permits are issued by the Noveleta Municipal Hall (Business Permits and Licensing Office). Bring your Barangay Clearance, which you can request free of charge through Service Request in CiviCare.',
    responseTl:
      'Ang business permit ay ibinibigay ng Noveleta Municipal Hall (Business Permits and Licensing Office). Dalhin ang iyong Barangay Clearance, na maaari mong i-request nang libre sa Service Request ng CiviCare.',
  },
  {
    label: 'Requirements',
    labelTl: 'Mga Kailangan',
    response:
      'Most requests need: one valid government-issued ID, proof of residency in Barangay Magdiwang, and the purpose of the request. Residents not yet in the RBI must visit the Barangay Hall first for the Data Capture Form.',
    responseTl:
      'Karamihan ng request ay nangangailangan ng: isang valid na government ID, patunay na nakatira sa Barangay Magdiwang, at ang layunin ng request. Ang mga hindi pa nakatala sa RBI ay kailangang pumunta muna sa Barangay Hall para sa Data Capture Form.',
  },
  {
    label: 'Report an Incident',
    labelTl: 'Mag-report ng Insidente',
    response: 'How to report an incident in CiviCare:',
    responseTl: 'Paano mag-report ng insidente sa CiviCare:',
    children: [
      {
        label: 'Reporting steps',
        labelTl: 'Mga hakbang',
        response:
          '1) Open Incident Reporting. 2) Tap "Use your location" or tap the map where it happened. 3) Pick the type (Fire, Electrical, Road Accident, Rescue, Others). 4) Choose the priority. 5) Press REPORT NOW. You will get an SMS with your ticket number.',
        responseTl:
          '1) Buksan ang Incident Reporting. 2) Pindutin ang "Use your location" o i-tap sa mapa kung saan ito nangyari. 3) Piliin ang uri (Sunog, Kuryente, Aksidente sa Kalsada, Rescue, Iba pa). 4) Piliin ang priority. 5) Pindutin ang REPORT NOW. Makakatanggap ka ng SMS na may ticket number.',
      },
      {
        label: 'Ticket status meaning',
        labelTl: 'Kahulugan ng ticket status',
        response: 'PENDING - received, waiting for a responder. ONGOING - a responder is handling it. RESOLVED - the concern has been addressed.',
        responseTl: 'PENDING - natanggap na, naghihintay ng responder. ONGOING - may responder nang umaasikaso. RESOLVED - naayos na ang concern.',
      },
    ],
  },
  {
    label: 'Emergency Procedures',
    labelTl: 'Mga Gagawin sa Emergency',
    response: 'Choose a hazard. The evacuation center is at Medina\'s Compound, Magdiwang Highway, Noveleta, Cavite.',
    responseTl: 'Pumili ng panganib. Ang evacuation center ay nasa Medina\'s Compound, Magdiwang Highway, Noveleta, Cavite.',
    children: [
      {
        label: 'Flood',
        labelTl: 'Baha',
        response:
          'Move to higher ground when water starts rising. Turn off electricity at the main switch. Bring your go-bag and proceed to the evacuation center at Medina\'s Compound (see the Evacuation Map). Avoid walking through floodwater.',
        responseTl:
          'Lumipat sa mataas na lugar kapag tumataas ang tubig. Patayin ang kuryente sa main switch. Dalhin ang go-bag at pumunta sa evacuation center sa Medina\'s Compound (tingnan ang Evacuation Map). Iwasang lumusong sa baha.',
      },
      {
        label: 'Fire',
        labelTl: 'Sunog',
        response: 'Alert neighbors, call BFP, stay low under smoke, and go to your family meeting point. Do not go back inside.',
        responseTl: 'Alertuhin ang mga kapitbahay, tumawag sa BFP, yumuko sa ilalim ng usok, at pumunta sa meeting point ng pamilya. Huwag nang bumalik sa loob.',
      },
      {
        label: 'Earthquake',
        labelTl: 'Lindol',
        response: 'DROP, COVER and HOLD ON. When shaking stops, exit carefully and move to an open area away from buildings, posts, and wires. Expect aftershocks.',
        responseTl: 'DUCK, COVER at HOLD. Kapag tumigil ang pagyanig, lumabas nang maingat at pumunta sa open area malayo sa gusali, poste, at kawad. Asahan ang aftershocks.',
      },
      {
        label: 'Typhoon',
        labelTl: 'Bagyo',
        response: 'Monitor PAGASA signals and barangay SMS alerts. Secure loose objects, store food and water, charge phones, and evacuate early when advised.',
        responseTl: 'Bantayan ang PAGASA signals at SMS alerts ng barangay. Itali ang mga maluluwag na gamit, mag-imbak ng pagkain at tubig, mag-charge ng cellphone, at lumikas nang maaga kapag pinayuhan.',
      },
    ],
  },
  {
    label: 'Hotlines',
    labelTl: 'Mga Hotline',
    response:
      'For life-threatening emergencies call 911. All local numbers (barangay, BFP, PNP, MDRRMO, health center) are in the Emergency & Disaster Hub and on your Dashboard.',
    responseTl:
      'Para sa emergency na nagbabanta sa buhay, tumawag sa 911. Ang lahat ng lokal na numero (barangay, BFP, PNP, MDRRMO, health center) ay nasa Emergency & Disaster Hub at sa iyong Dashboard.',
  },
  {
    label: 'Office Hours',
    labelTl: 'Oras ng Opisina',
    response: 'The Barangay Hall is open Monday to Friday, 8:00 AM - 5:00 PM, except on public holidays.',
    responseTl: 'Bukas ang Barangay Hall Lunes hanggang Biyernes, 8:00 AM - 5:00 PM, maliban sa mga pista opisyal.',
  },
  {
    label: 'Events',
    labelTl: 'Mga Event',
    response:
      'Open Events & Activities to see this month\'s barangay events. Tap an event to view details and join. You can download your certificate after attending.',
    responseTl:
      'Buksan ang Events & Activities para makita ang mga event ng barangay ngayong buwan. I-tap ang event para makita ang detalye at sumali. Maaari mong i-download ang certificate pagkatapos dumalo.',
  },
  {
    label: 'Donation',
    labelTl: 'Donasyon',
    response:
      'Open Donations and press "New Pledge". Choose the type (cash, goods, food, medicine, clothes), enter the quantity, and optionally the beneficiary and a photo. You can track your pledge from Pledged to Received to Distributed.',
    responseTl:
      'Buksan ang Donations at pindutin ang "New Pledge". Piliin ang uri (pera, gamit, pagkain, gamot, damit), ilagay ang dami, at kung gusto ang beneficiary at litrato. Masusubaybayan mo ang iyong pledge mula Pledged, Received, hanggang Distributed.',
  },
];

// Seeded topics replaced by the panel revision (only Clearance and Indigency are offered, no fees).
const OBSOLETE_LABELS = ['Other Certificates', 'Barangay Certificate', 'Certificate of Residency', 'Emergency Hotlines', 'Evacuation Procedures'];

module.exports = { CHATBOT_TREE, OBSOLETE_LABELS };
