var initESW = function(gslbBaseUrl) {
	embedded_svc.settings.avatarImgURL = 'https://esw1234.github.io/avatar.png';
	embedded_svc.settings.prechatBackgroundImgURL = 'https://esw1234.github.io/Prechat_image.png';
	embedded_svc.settings.waitingStateBackgroundImgURL = 'https://esw1234.github.io/waitingStateImage.png';
	embedded_svc.settings.smallCompanyLogoImgURL = 'https://esw1234.github.io/smallCompanyLogoImg.png';
	embedded_svc.settings.targetElement = "button_goes_here";
	
	embedded_svc.init('https://na1-blitz01.soma.salesforce.com',
			'https://d.la-blitz01.soma.salesforce.com/chat',
			'https://c.la-blitz01.soma.salesforce.com/content',
			'https://fitbit-1475b6fa058-1550a73a5d9.blitz01.soma.force.com/igorKokua',
			'572D00000004CUv', '00DD00000008FQY', '573D00000004Ceq', '204.0',
			null);
}
