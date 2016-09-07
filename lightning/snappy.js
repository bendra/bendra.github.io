var initESW = function(gslbBaseUrl) {
	embedded_svc.settings.avatarImgURL = 'https://esw1234.github.io/avatar.png';
	embedded_svc.settings.prechatBackgroundImgURL = 'https://esw1234.github.io/Prechat_image.png';
	embedded_svc.settings.waitingStateBackgroundImgURL = 'https://esw1234.github.io/waitingStateImage.png';
	embedded_svc.settings.smallCompanyLogoImgURL = 'https://esw1234.github.io/smallCompanyLogoImg.png';
	embedded_svc.settings.targetElement = "button_goes_here";
	
	embedded_svc.init('http://bdrasin-ltm2.internal.salesforce.com:6109',
			'http://bdrasin-ltm2.internal.salesforce.com:8096/chat',
			'https://bdrasin-ltm2.internal.salesforce.com:8095/content',
			'https://bdrasin-ltm-comm.localhost.force.com:6101/t3c1',
			'572xx0000000001', '00Dxx0000001gEg', '573xx0000000001', '204.0',
			gslbBaseUrl);
}
