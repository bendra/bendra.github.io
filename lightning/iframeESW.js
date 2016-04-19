/**
 * Resizes the iFrame width so it fits its content
 */
function esw_resize_iframe(){
	var iFrame = document.getElementById("__SFDC_ESW_FRAME");
	esw_do_resize(iFrame);
}

function esw_do_resize(iFrame){
	var iFrameDoc = iFrame.contentWindow.document;
	//TODO: replace with a nicer way of calculating height, status etc.
	var helpButton = iFrameDoc.getElementsByTagName("Button");
	if(minimize){
		if (button && button.classList.contains("agentOnline")){
			iFrame.style.height = 502;
			iFrame.style.width = 320
		}
	}else{
		iFrame.style.height = 60;
		iFrame.style.width = 210;		
	}
}

window.onload = function() {
	// make sure we don't reload if already present
	if (!document.getElementById("__SFDC_ESW_FRAME")) {
		var html = " <body>\
		<script src='https://subbu--c.na1-blitz04.visual.soma.force.com/lightning/lightning.out.js'></script> \
		<div id='button_goes_here'/> \
	<script> \
    $Lightning.use('embeddedService:liveAgentSidebarApp', function() { \
       $Lightning.createComponent('embeddedService:liveAgentSidebar', { \
         deploymentId : '572D00000004CSa', \
         orgId : '00DD00000008649', \
         buttonId : '573D00000004CWm', \
         endpointURL : 'https://d.la-blitz04.soma.salesforce.com/chat', \
         avatarImgURL : 'avatar.png', \
         prechatBackgroundImgURL : 'Prechat_image.png', \
         waitingStateBackgroundImgURL : 'waitingStateImage.png', \
         smallCompanyLogoImgURL : 'smallCompanyLogoImg.png', \
         chasitorContentServerEndpointURL : 'https://d.la-blitz04.soma.salesforce.com/content', \
         chasitorSrcURL : ['https://na1-blitz04.soma.salesforce.com/jslibrary/1457334052000/ui-sfdc-javascript-impl/SfdcCore.js','https://d.la-blitz04.soma.salesforce.com/content/g/js/37.0/chasitor.js'] \
        }, 'button_goes_here'); \
   },'https://subbu.blitz04.soma.force.com/esw0108'); \
	</script>\
	<body>";

		var iFrame = document.createElement("iframe");
		iFrame.setAttribute("id", "__SFDC_ESW_FRAME");
		iFrame.setAttribute("style", "bottom: 0; right: 0; position: fixed; height:60px; width:210px; border: none; background: transparent");
		document.body.appendChild(iFrame);
		iFrame.contentWindow.document.open();
		iFrame.contentWindow.document.write(html);
		iFrame.contentWindow.document.close();	
	}
}
