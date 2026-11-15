/** Geographic labels for the editorial anchors already described by these records.
 * These name schematic endpoints, not additional stops or reconstructed tracks.
 * Keep them explicit: record titles are prose, not a source for map geometry.
 */
export const routeEndpointLabels:Readonly<Record<string,readonly [string,string]>>={
  'history-lapita-bismarcks-vanuatu':['Bismarck Archipelago','Vanuatu'],
  'history-lapita-vanuatu-fiji':['Vanuatu','Fiji'],
  'history-lapita-fiji-tonga':['Fiji','Tonga'],
  'history-lapita-fiji-samoa':['Fiji','Samoa'],
  'history-west-east-polynesia-migration':['Samoa–Tonga region','Society Islands'],
  'history-central-polynesia-rapanui':['Southeastern East Polynesia','Rapa Nui'],
  'history-samoa-tonga-exchange':['Samoa','Tonga'],
  'history-samoa-mangaia-exchange':['Samoa','Mangaia'],
  'history-rurutu-mangaia-exchange':['Rurutu','Mangaia'],
  'history-eiao-cooks-exchange':['Eiao','Mangaia'],
  'history-mangareva-pitcairn-henderson':['Mangareva','Henderson'],
  'history-manila-acapulco-eastbound':['Manila','Acapulco'],
  'history-acapulco-manila-westbound':['Acapulco','Manila'],
  'history-veracruz-havana-fleets':['Veracruz','Havana'],
  'history-havana-spain-fleets':['Havana','Spain'],
  'history-mesoamerica-chaco-macaws':['Mesoamerica region','Chaco Canyon'],
};

export const routeDirectionLabels:Readonly<Record<string,string>>={
  'history-manila-acapulco-eastbound':'Eastbound',
  'history-acapulco-manila-westbound':'Westbound',
};
