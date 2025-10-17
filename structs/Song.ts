try {
  song = await Song.from(url, url);
} catch (error: any) {
  console.error(error);

  if (error.name === "RateLimited" || error.message === 'RATE_LIMITED') {
    return interaction.editReply({ 
      content: '⚠️ YouTube está bloqueando las peticiones. Por favor espera unos minutos antes de intentar nuevamente.' 
    }).catch(console.error);
  }
  
  if (error.name == "NoResults") {
    return interaction.editReply({ 
      content: i18n.__mf("play.errorNoResults", { url: `<${url}>` }) 
    }).catch(console.error);
  }

  if (error.name == "InvalidURL") {
    return interaction.editReply({ 
      content: i18n.__mf("play.errorInvalidURL", { url: `<${url}>` }) 
    }).catch(console.error);
  }

  return interaction.editReply({ 
    content: i18n.__("common.errorCommand") 
  }).catch(console.error);
}
