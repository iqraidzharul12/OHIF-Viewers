function lowercaseFirstLetter(val: string) {
  return String(val).charAt(0).toLowerCase() + String(val).slice(1);
}

export const MapJsonValue = (data: any): any => {
  return data.map((item)=> {
    const newItem = {...item}
    const mainDicomTags = item.mainDicomTags
    const patientMainDicomTags = item.patientMainDicomTags
    Object.keys(mainDicomTags || {}).forEach(function(key) {
      const name = lowercaseFirstLetter(mainDicomTags[key].name)
      newItem[name] = mainDicomTags[key].value
    })
    Object.keys(patientMainDicomTags || {}).forEach(function(key) {
      const name = lowercaseFirstLetter(patientMainDicomTags[key].name)
      newItem[name] = patientMainDicomTags[key].value
    })
    return newItem
  })
}
