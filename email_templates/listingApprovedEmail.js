export const ListingApprovedMail = async (fullName, listingName, approvalDate, approvalReason) => {
    return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Listing Approved</title><!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
<noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
<![endif]--><!--[if !mso]><!---->
  <link href="https://fonts.googleapis.com/css2?family=Marcellus&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans&display=swap" rel="stylesheet"><!--<![endif]-->
  <style type="text/css">
    /* Email CSS styles */
    .rollover:hover .rollover-first {
      max-height:0px!important;
      display:none!important;
    }
    .rollover:hover .rollover-second {
      max-height:none!important;
      display:block!important;
    }
    .rollover span {
      font-size:0px;
    }
    #outlook a { padding:0; }
    span.MsoHyperlink, span.MsoHyperlinkFollowed {
      color:inherit;
      mso-style-priority:99;
    }
    a.es-button {
      mso-style-priority:100!important;
      text-decoration:none!important;
    }
    a[x-apple-data-detectors], #MessageViewBody a {
      color:inherit!important;
      text-decoration:none!important;
      font-size:inherit!important;
      font-family:inherit!important;
      font-weight:inherit!important;
      line-height:inherit!important;
    }
    .es-header-body h1, .es-content-body h1, .es-footer-body h1 {
      font-family:Marcellus, Arial, serif;
    }
    .es-content-body p {
      font-family:'Work Sans', Arial, sans-serif;
      font-size:14px;
      color:#00356C;
    }
    /* Responsive media queries */
    @media only screen and (max-width:600px) {
      /* Mobile styles */
    }
  </style>
 </head>
 <body class="body" style="width:100%;height:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FAFAFA">
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" style="width:100%;height:100%;background-color:#FAFAFA">
     <tr>
      <td valign="top">
       <table cellpadding="0" cellspacing="0" align="center" class="es-header" style="background-color:transparent;width:100%;">
         <tr>
          <td align="center">
           <table align="center" cellpadding="0" cellspacing="0" bgcolor="transparent" class="es-header-body" style="background-color:transparent;width:600px;">
             <tr>
              <td align="left" style="padding:20px 40px;">
               <table cellpadding="0" cellspacing="0" width="100%">
                 <tr>
                  <td align="center">
                   <h1 style="font-family:Marcellus, Arial, serif; font-size:22px; color:#560f85;">Your Listing Has Been Approved!</h1>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">Dear ${fullName},</p>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">
                      We are thrilled to inform you that your listing <strong>${listingName}</strong> has been successfully approved on <strong>${approvalDate}</strong>.
                   </p>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">
                     ${approvalReason ? `Note: ${approvalReason}` : ''}
                   </p>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">
                      Your property is now live on our platform and ready to be booked by guests. You can now start receiving reservations!
                   </p>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">Thank you for choosing Ourspace. We look forward to supporting your success as a host!</p>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">Warm regards,</p>
                   <p style="font-family: 'Work Sans', Arial, sans-serif; font-size:14px; color:#00356C;">The Ourspace Team</p>
                  </td>
                 </tr>
               </table>
              </td>
             </tr>
           </table>
          </td>
         </tr>
       </table>
      </td>
     </tr>
   </table>
  </div>
 </body>
</html>
`;
};

