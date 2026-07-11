(() => {
  "use strict";

  const guides = [
  {
    "id": "01-register-and-login-01-login-and-register-screen",
    "category": "Register and Login",
    "title": "Login and Register Screen",
    "topicIds": [
      "account-register-signup",
      "account-login-login",
      "account-login-methods"
    ],
    "images": [
      {
        "src": "./assets/screenshots/01_Register_and_Login/01_Login_and_Register_Screen/01_01_Login_and_Register_Screen.png",
        "step": 1,
        "alt": "Login and Register Screen — step 1",
        "captionEn": "Visual reference — Login and Register Screen",
        "captionAr": "مرجع مرئي — Login and Register Screen"
      }
    ]
  },
  {
    "id": "01-register-and-login-02-reset-account-password",
    "category": "Register and Login",
    "title": "Reset Account Password",
    "topicIds": [
      "account-security-reset",
      "account-login-recovery",
      "sv-refined-password-reset-request-submitted"
    ],
    "images": [
      {
        "src": "./assets/screenshots/01_Register_and_Login/02_Reset_Account_Password/01_02_Reset_Account_Password.png",
        "step": 1,
        "alt": "Reset Account Password — step 1",
        "captionEn": "Step 1 of 4 — Reset Account Password",
        "captionAr": "الخطوة 1 من 4 — Reset Account Password"
      },
      {
        "src": "./assets/screenshots/01_Register_and_Login/02_Reset_Account_Password/02_02_Reset_Account_Password.png",
        "step": 2,
        "alt": "Reset Account Password — step 2",
        "captionEn": "Step 2 of 4 — Reset Account Password",
        "captionAr": "الخطوة 2 من 4 — Reset Account Password"
      },
      {
        "src": "./assets/screenshots/01_Register_and_Login/02_Reset_Account_Password/03_02_Reset_Account_Password.png",
        "step": 3,
        "alt": "Reset Account Password — step 3",
        "captionEn": "Step 3 of 4 — Reset Account Password",
        "captionAr": "الخطوة 3 من 4 — Reset Account Password"
      },
      {
        "src": "./assets/screenshots/01_Register_and_Login/02_Reset_Account_Password/04_02_Reset_Account_Password.png",
        "step": 4,
        "alt": "Reset Account Password — step 4",
        "captionEn": "Step 4 of 4 — Reset Account Password",
        "captionAr": "الخطوة 4 من 4 — Reset Account Password"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-01-open-settings-from-me",
    "category": "Profile and Settings",
    "title": "Open Settings from ME",
    "topicIds": [
      "account-support-optimized"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/01_Open_Settings_from_ME/01_01_Open_Settings_from_ME.png",
        "step": 1,
        "alt": "Open Settings from ME — step 1",
        "captionEn": "Visual reference — Open Settings from ME",
        "captionAr": "مرجع مرئي — Open Settings from ME"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-02-open-settings-arabic",
    "category": "Profile and Settings",
    "title": "Open Settings Arabic",
    "topicIds": [
      "account-support-optimized"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/02_Open_Settings_Arabic/01_02_Open_Settings_Arabic.png",
        "step": 1,
        "alt": "Open Settings Arabic — step 1",
        "captionEn": "Visual reference — Open Settings Arabic",
        "captionAr": "مرجع مرئي — Open Settings Arabic"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-03-change-avatar-image",
    "category": "Profile and Settings",
    "title": "Change Avatar Image",
    "topicIds": [
      "account-profile-picture"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/03_Change_Avatar_Image/01_03_Change_Avatar_Image.png",
        "step": 1,
        "alt": "Change Avatar Image — step 1",
        "captionEn": "Visual reference — Change Avatar Image",
        "captionAr": "مرجع مرئي — Change Avatar Image"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-04-open-profile-avatar",
    "category": "Profile and Settings",
    "title": "Open Profile Avatar",
    "topicIds": [
      "account-profile-picture"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/04_Open_Profile_Avatar/01_04_Open_Profile_Avatar.png",
        "step": 1,
        "alt": "Open Profile Avatar — step 1",
        "captionEn": "Visual reference — Open Profile Avatar",
        "captionAr": "مرجع مرئي — Open Profile Avatar"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-05-profile-cards-and-tabs",
    "category": "Profile and Settings",
    "title": "Profile Cards and Tabs",
    "topicIds": [
      "account-profile-picture",
      "function-social-finding-account-id"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/05_Profile_Cards_and_Tabs/01_05_Profile_Cards_and_Tabs.png",
        "step": 1,
        "alt": "Profile Cards and Tabs — step 1",
        "captionEn": "Step 1 of 2 — Profile Cards and Tabs",
        "captionAr": "الخطوة 1 من 2 — Profile Cards and Tabs"
      },
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/05_Profile_Cards_and_Tabs/02_05_Profile_Cards_and_Tabs.png",
        "step": 2,
        "alt": "Profile Cards and Tabs — step 2",
        "captionEn": "Step 2 of 2 — Profile Cards and Tabs",
        "captionAr": "الخطوة 2 من 2 — Profile Cards and Tabs"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-06-edit-profile-avatar",
    "category": "Profile and Settings",
    "title": "Edit Profile Avatar",
    "topicIds": [
      "account-profile-picture"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/06_Edit_Profile_Avatar/01_06_Edit_Profile_Avatar.png",
        "step": 1,
        "alt": "Edit Profile Avatar — step 1",
        "captionEn": "Visual reference — Edit Profile Avatar",
        "captionAr": "مرجع مرئي — Edit Profile Avatar"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-07-open-me-page",
    "category": "Profile and Settings",
    "title": "Open ME Page",
    "topicIds": [
      "account-support-optimized"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/07_Open_ME_Page/01_07_Open_ME_Page.png",
        "step": 1,
        "alt": "Open ME Page — step 1",
        "captionEn": "Visual reference — Open ME Page",
        "captionAr": "مرجع مرئي — Open ME Page"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-08-change-app-language",
    "category": "Profile and Settings",
    "title": "Change App Language",
    "topicIds": [
      "account-support-optimized",
      "account-profile-location"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/08_Change_App_Language/01_08_Change_App_Language.png",
        "step": 1,
        "alt": "Change App Language — step 1",
        "captionEn": "Step 1 of 3 — Change App Language",
        "captionAr": "الخطوة 1 من 3 — Change App Language"
      },
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/08_Change_App_Language/02_08_Change_App_Language.png",
        "step": 2,
        "alt": "Change App Language — step 2",
        "captionEn": "Step 2 of 3 — Change App Language",
        "captionAr": "الخطوة 2 من 3 — Change App Language"
      },
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/08_Change_App_Language/03_08_Change_App_Language.png",
        "step": 3,
        "alt": "Change App Language — step 3",
        "captionEn": "Step 3 of 3 — Change App Language",
        "captionAr": "الخطوة 3 من 3 — Change App Language"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-09-profile-header",
    "category": "Profile and Settings",
    "title": "Profile Header",
    "topicIds": [
      "account-profile-picture",
      "account-profile-nickname"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/09_Profile_Header/01_09_Profile_Header.png",
        "step": 1,
        "alt": "Profile Header — step 1",
        "captionEn": "Visual reference — Profile Header",
        "captionAr": "مرجع مرئي — Profile Header"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-10-upload-app-log",
    "category": "Profile and Settings",
    "title": "Upload App Log",
    "topicIds": [
      "sv-refined-app-crash-upload-log",
      "function-games-crashing"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/10_Upload_App_Log/01_10_Upload_App_Log.png",
        "step": 1,
        "alt": "Upload App Log — step 1",
        "captionEn": "Visual reference — Upload App Log",
        "captionAr": "مرجع مرئي — Upload App Log"
      }
    ]
  },
  {
    "id": "02-profile-and-settings-11-upload-app-log-arabic",
    "category": "Profile and Settings",
    "title": "Upload App Log Arabic",
    "topicIds": [
      "sv-refined-app-crash-upload-log",
      "function-games-crashing"
    ],
    "images": [
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/11_Upload_App_Log_Arabic/01_11_Upload_App_Log_Arabic.png",
        "step": 1,
        "alt": "Upload App Log Arabic — step 1",
        "captionEn": "Step 1 of 3 — Upload App Log Arabic",
        "captionAr": "الخطوة 1 من 3 — Upload App Log Arabic"
      },
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/11_Upload_App_Log_Arabic/02_11_Upload_App_Log_Arabic.png",
        "step": 2,
        "alt": "Upload App Log Arabic — step 2",
        "captionEn": "Step 2 of 3 — Upload App Log Arabic",
        "captionAr": "الخطوة 2 من 3 — Upload App Log Arabic"
      },
      {
        "src": "./assets/screenshots/02_Profile_and_Settings/11_Upload_App_Log_Arabic/03_11_Upload_App_Log_Arabic.png",
        "step": 3,
        "alt": "Upload App Log Arabic — step 3",
        "captionEn": "Step 3 of 3 — Upload App Log Arabic",
        "captionAr": "الخطوة 3 من 3 — Upload App Log Arabic"
      }
    ]
  },
  {
    "id": "03-recharge-coins-and-diamonds-01-recharge-balance",
    "category": "Recharge Coins and Diamonds",
    "title": "Recharge Balance",
    "topicIds": [
      "payment-recharge-process",
      "payment-support-optimized",
      "sv-refined-recharge-steps"
    ],
    "images": [
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/01_Recharge_Balance/01_01_Recharge_Balance.png",
        "step": 1,
        "alt": "Recharge Balance — step 1",
        "captionEn": "Visual reference — Recharge Balance",
        "captionAr": "مرجع مرئي — Recharge Balance"
      }
    ]
  },
  {
    "id": "03-recharge-coins-and-diamonds-02-coin-free-draw-options",
    "category": "Recharge Coins and Diamonds",
    "title": "Coin Free Draw Options",
    "topicIds": [
      "function-tasks-getting-free-coins"
    ],
    "images": [
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/02_Coin_Free_Draw_Options/01_02_Coin_Free_Draw_Options.png",
        "step": 1,
        "alt": "Coin Free Draw Options — step 1",
        "captionEn": "Visual reference — Coin Free Draw Options",
        "captionAr": "مرجع مرئي — Coin Free Draw Options"
      }
    ]
  },
  {
    "id": "03-recharge-coins-and-diamonds-03-dobi-coin-center-and-record",
    "category": "Recharge Coins and Diamonds",
    "title": "Dobi Coin Center and Record",
    "topicIds": [
      "payment-recharge-dobi-balance",
      "payment-recharge-coin-history"
    ],
    "images": [
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/03_Dobi_Coin_Center_and_Record/01_03_Dobi_Coin_Center_and_Record.png",
        "step": 1,
        "alt": "Dobi Coin Center and Record — step 1",
        "captionEn": "Step 1 of 3 — Dobi Coin Center and Record",
        "captionAr": "الخطوة 1 من 3 — Dobi Coin Center and Record"
      },
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/03_Dobi_Coin_Center_and_Record/02_03_Dobi_Coin_Center_and_Record.png",
        "step": 2,
        "alt": "Dobi Coin Center and Record — step 2",
        "captionEn": "Step 2 of 3 — Dobi Coin Center and Record",
        "captionAr": "الخطوة 2 من 3 — Dobi Coin Center and Record"
      },
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/03_Dobi_Coin_Center_and_Record/03_03_Dobi_Coin_Center_and_Record.png",
        "step": 3,
        "alt": "Dobi Coin Center and Record — step 3",
        "captionEn": "Step 3 of 3 — Dobi Coin Center and Record",
        "captionAr": "الخطوة 3 من 3 — Dobi Coin Center and Record"
      }
    ]
  },
  {
    "id": "03-recharge-coins-and-diamonds-04-diamonds-menu",
    "category": "Recharge Coins and Diamonds",
    "title": "Diamonds Menu",
    "topicIds": [
      "payment-diamonds-acquisition",
      "payment-diamonds-exchanging"
    ],
    "images": [
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/04_Diamonds_Menu/01_04_Diamonds_Menu.png",
        "step": 1,
        "alt": "Diamonds Menu — step 1",
        "captionEn": "Visual reference — Diamonds Menu",
        "captionAr": "مرجع مرئي — Diamonds Menu"
      }
    ]
  },
  {
    "id": "03-recharge-coins-and-diamonds-05-general-tools-menu",
    "category": "Recharge Coins and Diamonds",
    "title": "General Tools Menu",
    "topicIds": [
      "payment-support-optimized"
    ],
    "images": [
      {
        "src": "./assets/screenshots/03_Recharge_Coins_and_Diamonds/05_General_Tools_Menu/01_05_General_Tools_Menu.png",
        "step": 1,
        "alt": "General Tools Menu — step 1",
        "captionEn": "Visual reference — General Tools Menu",
        "captionAr": "مرجع مرئي — General Tools Menu"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-01-vip-center",
    "category": "VIP and SVIP",
    "title": "VIP Center",
    "topicIds": [
      "payment-vip-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/01_VIP_Center/01_01_VIP_Center.png",
        "step": 1,
        "alt": "VIP Center — step 1",
        "captionEn": "Visual reference — VIP Center",
        "captionAr": "مرجع مرئي — VIP Center"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-02-vip-recharge-entry",
    "category": "VIP and SVIP",
    "title": "VIP Recharge Entry",
    "topicIds": [
      "payment-vip-overview",
      "payment-svip-offline-recharge"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/02_VIP_Recharge_Entry/01_02_VIP_Recharge_Entry.png",
        "step": 1,
        "alt": "VIP Recharge Entry — step 1",
        "captionEn": "Visual reference — VIP Recharge Entry",
        "captionAr": "مرجع مرئي — VIP Recharge Entry"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-03-vip-reward-page",
    "category": "VIP and SVIP",
    "title": "VIP Reward Page",
    "topicIds": [
      "payment-vip-overview",
      "payment-vip-experience-card"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/03_VIP_Reward_Page/01_03_VIP_Reward_Page.png",
        "step": 1,
        "alt": "VIP Reward Page — step 1",
        "captionEn": "Visual reference — VIP Reward Page",
        "captionAr": "مرجع مرئي — VIP Reward Page"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-04-vip-entry-arabic",
    "category": "VIP and SVIP",
    "title": "VIP Entry Arabic",
    "topicIds": [
      "payment-vip-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/04_VIP_Entry_Arabic/01_04_VIP_Entry_Arabic.png",
        "step": 1,
        "alt": "VIP Entry Arabic — step 1",
        "captionEn": "Visual reference — VIP Entry Arabic",
        "captionAr": "مرجع مرئي — VIP Entry Arabic"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-05-svip-profile-page",
    "category": "VIP and SVIP",
    "title": "SVIP Profile Page",
    "topicIds": [
      "payment-svip-privileges",
      "payment-svip-becoming"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/05_SVIP_Profile_Page/01_05_SVIP_Profile_Page.png",
        "step": 1,
        "alt": "SVIP Profile Page — step 1",
        "captionEn": "Visual reference — SVIP Profile Page",
        "captionAr": "مرجع مرئي — SVIP Profile Page"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-06-svip-center-header",
    "category": "VIP and SVIP",
    "title": "SVIP Center Header",
    "topicIds": [
      "payment-svip-privileges"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/06_SVIP_Center_Header/01_06_SVIP_Center_Header.png",
        "step": 1,
        "alt": "SVIP Center Header — step 1",
        "captionEn": "Visual reference — SVIP Center Header",
        "captionAr": "مرجع مرئي — SVIP Center Header"
      }
    ]
  },
  {
    "id": "04-vip-and-svip-07-svip-level-page",
    "category": "VIP and SVIP",
    "title": "SVIP Level Page",
    "topicIds": [
      "payment-svip-level-requirements",
      "payment-svip-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/04_VIP_and_SVIP/07_SVIP_Level_Page/01_07_SVIP_Level_Page.png",
        "step": 1,
        "alt": "SVIP Level Page — step 1",
        "captionEn": "Visual reference — SVIP Level Page",
        "captionAr": "مرجع مرئي — SVIP Level Page"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-01-vip-store-items",
    "category": "Store Backpack and Aristocracy",
    "title": "VIP Store Items",
    "topicIds": [
      "payment-vip-overview",
      "payment-svip-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/01_VIP_Store_Items/01_01_VIP_Store_Items.png",
        "step": 1,
        "alt": "VIP Store Items — step 1",
        "captionEn": "Visual reference — VIP Store Items",
        "captionAr": "مرجع مرئي — VIP Store Items"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-02-vip-store-balance",
    "category": "Store Backpack and Aristocracy",
    "title": "VIP Store Balance",
    "topicIds": [
      "payment-vip-overview",
      "payment-svip-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/02_VIP_Store_Balance/01_02_VIP_Store_Balance.png",
        "step": 1,
        "alt": "VIP Store Balance — step 1",
        "captionEn": "Visual reference — VIP Store Balance",
        "captionAr": "مرجع مرئي — VIP Store Balance"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-03-elite-club-page",
    "category": "Store Backpack and Aristocracy",
    "title": "Elite Club Page",
    "topicIds": [
      "payment-svip-elite-club",
      "sv-refined-elite-club-conditions"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/03_Elite_Club_Page/01_03_Elite_Club_Page.png",
        "step": 1,
        "alt": "Elite Club Page — step 1",
        "captionEn": "Visual reference — Elite Club Page",
        "captionAr": "مرجع مرئي — Elite Club Page"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-04-aristocracy-profile",
    "category": "Store Backpack and Aristocracy",
    "title": "Aristocracy Profile",
    "topicIds": [
      "payment-aristocracy-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/04_Aristocracy_Profile/01_04_Aristocracy_Profile.png",
        "step": 1,
        "alt": "Aristocracy Profile — step 1",
        "captionEn": "Visual reference — Aristocracy Profile",
        "captionAr": "مرجع مرئي — Aristocracy Profile"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-05-aristocracy-entry",
    "category": "Store Backpack and Aristocracy",
    "title": "Aristocracy Entry",
    "topicIds": [
      "payment-aristocracy-overview",
      "payment-aristocracy-invisibility"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/05_Aristocracy_Entry/01_05_Aristocracy_Entry.png",
        "step": 1,
        "alt": "Aristocracy Entry — step 1",
        "captionEn": "Visual reference — Aristocracy Entry",
        "captionAr": "مرجع مرئي — Aristocracy Entry"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-06-open-backpack",
    "category": "Store Backpack and Aristocracy",
    "title": "Open Backpack",
    "topicIds": [
      "function-social-transfer-gifts",
      "payment-decoration-equipping"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/06_Open_Backpack/01_06_Open_Backpack.png",
        "step": 1,
        "alt": "Open Backpack — step 1",
        "captionEn": "Visual reference — Open Backpack",
        "captionAr": "مرجع مرئي — Open Backpack"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-07-store-home",
    "category": "Store Backpack and Aristocracy",
    "title": "Store Home",
    "topicIds": [
      "payment-decoration-acquiring"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/07_Store_Home/01_07_Store_Home.png",
        "step": 1,
        "alt": "Store Home — step 1",
        "captionEn": "Visual reference — Store Home",
        "captionAr": "مرجع مرئي — Store Home"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-08-open-store-from-me",
    "category": "Store Backpack and Aristocracy",
    "title": "Open Store from ME",
    "topicIds": [
      "payment-decoration-acquiring"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/08_Open_Store_from_ME/01_08_Open_Store_from_ME.png",
        "step": 1,
        "alt": "Open Store from ME — step 1",
        "captionEn": "Visual reference — Open Store from ME",
        "captionAr": "مرجع مرئي — Open Store from ME"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-09-open-me-tab",
    "category": "Store Backpack and Aristocracy",
    "title": "Open ME Tab",
    "topicIds": [
      "account-support-optimized"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/09_Open_ME_Tab/01_09_Open_ME_Tab.png",
        "step": 1,
        "alt": "Open ME Tab — step 1",
        "captionEn": "Visual reference — Open ME Tab",
        "captionAr": "مرجع مرئي — Open ME Tab"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-10-store-menu-arabic",
    "category": "Store Backpack and Aristocracy",
    "title": "Store Menu Arabic",
    "topicIds": [
      "payment-decoration-acquiring"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/10_Store_Menu_Arabic/01_10_Store_Menu_Arabic.png",
        "step": 1,
        "alt": "Store Menu Arabic — step 1",
        "captionEn": "Visual reference — Store Menu Arabic",
        "captionAr": "مرجع مرئي — Store Menu Arabic"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-11-special-effects-settings",
    "category": "Store Backpack and Aristocracy",
    "title": "Special Effects Settings",
    "topicIds": [
      "payment-decoration-equipping",
      "payment-decoration-entry-effect"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/11_Special_Effects_Settings/01_11_Special_Effects_Settings.png",
        "step": 1,
        "alt": "Special Effects Settings — step 1",
        "captionEn": "Step 1 of 3 — Special Effects Settings",
        "captionAr": "الخطوة 1 من 3 — Special Effects Settings"
      },
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/11_Special_Effects_Settings/02_11_Special_Effects_Settings.png",
        "step": 2,
        "alt": "Special Effects Settings — step 2",
        "captionEn": "Step 2 of 3 — Special Effects Settings",
        "captionAr": "الخطوة 2 من 3 — Special Effects Settings"
      },
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/11_Special_Effects_Settings/03_11_Special_Effects_Settings.png",
        "step": 3,
        "alt": "Special Effects Settings — step 3",
        "captionEn": "Step 3 of 3 — Special Effects Settings",
        "captionAr": "الخطوة 3 من 3 — Special Effects Settings"
      }
    ]
  },
  {
    "id": "05-store-backpack-and-aristocracy-12-equip-vehicle-effect",
    "category": "Store Backpack and Aristocracy",
    "title": "Equip Vehicle Effect",
    "topicIds": [
      "payment-decoration-equipping",
      "payment-decoration-entry-effect"
    ],
    "images": [
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/12_Equip_Vehicle_Effect/01_12_Equip_Vehicle_Effect.png",
        "step": 1,
        "alt": "Equip Vehicle Effect — step 1",
        "captionEn": "Step 1 of 3 — Equip Vehicle Effect",
        "captionAr": "الخطوة 1 من 3 — Equip Vehicle Effect"
      },
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/12_Equip_Vehicle_Effect/02_12_Equip_Vehicle_Effect.png",
        "step": 2,
        "alt": "Equip Vehicle Effect — step 2",
        "captionEn": "Step 2 of 3 — Equip Vehicle Effect",
        "captionAr": "الخطوة 2 من 3 — Equip Vehicle Effect"
      },
      {
        "src": "./assets/screenshots/05_Store_Backpack_and_Aristocracy/12_Equip_Vehicle_Effect/03_12_Equip_Vehicle_Effect.png",
        "step": 3,
        "alt": "Equip Vehicle Effect — step 3",
        "captionEn": "Step 3 of 3 — Equip Vehicle Effect",
        "captionAr": "الخطوة 3 من 3 — Equip Vehicle Effect"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-01-user-search",
    "category": "Users Follow and Block",
    "title": "User Search",
    "topicIds": [
      "function-social-searching-friends",
      "function-social-user-not-found"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/01_User_Search/01_01_User_Search.png",
        "step": 1,
        "alt": "User Search — step 1",
        "captionEn": "Visual reference — User Search",
        "captionAr": "مرجع مرئي — User Search"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-02-user-profile-badge",
    "category": "Users Follow and Block",
    "title": "User Profile Badge",
    "topicIds": [
      "function-social-finding-account-id"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/02_User_Profile_Badge/01_02_User_Profile_Badge.png",
        "step": 1,
        "alt": "User Profile Badge — step 1",
        "captionEn": "Visual reference — User Profile Badge",
        "captionAr": "مرجع مرئي — User Profile Badge"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-03-user-profile",
    "category": "Users Follow and Block",
    "title": "User Profile",
    "topicIds": [
      "function-social-finding-account-id",
      "function-social-following-users"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/03_User_Profile/01_03_User_Profile.png",
        "step": 1,
        "alt": "User Profile — step 1",
        "captionEn": "Visual reference — User Profile",
        "captionAr": "مرجع مرئي — User Profile"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-04-unfollow-user",
    "category": "Users Follow and Block",
    "title": "Unfollow User",
    "topicIds": [
      "function-social-unfollowing-users"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/04_Unfollow_User/01_04_Unfollow_User.png",
        "step": 1,
        "alt": "Unfollow User — step 1",
        "captionEn": "Visual reference — Unfollow User",
        "captionAr": "مرجع مرئي — Unfollow User"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-05-report-block-and-unblock",
    "category": "Users Follow and Block",
    "title": "Report Block and Unblock",
    "topicIds": [
      "function-social-reporting",
      "function-social-blocking-users",
      "function-social-blacklist-unblock"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/05_Report_Block_and_Unblock/01_05_Report_Block_and_Unblock.png",
        "step": 1,
        "alt": "Report Block and Unblock — step 1",
        "captionEn": "Visual reference — Report Block and Unblock",
        "captionAr": "مرجع مرئي — Report Block and Unblock"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-06-blacklist-setting",
    "category": "Users Follow and Block",
    "title": "Blacklist Setting",
    "topicIds": [
      "function-social-blacklist-unblock"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/06_Blacklist_Setting/01_06_Blacklist_Setting.png",
        "step": 1,
        "alt": "Blacklist Setting — step 1",
        "captionEn": "Visual reference — Blacklist Setting",
        "captionAr": "مرجع مرئي — Blacklist Setting"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-07-blacklist-arabic",
    "category": "Users Follow and Block",
    "title": "Blacklist Arabic",
    "topicIds": [
      "function-social-blacklist-unblock"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/07_Blacklist_Arabic/01_07_Blacklist_Arabic.png",
        "step": 1,
        "alt": "Blacklist Arabic — step 1",
        "captionEn": "Visual reference — Blacklist Arabic",
        "captionAr": "مرجع مرئي — Blacklist Arabic"
      }
    ]
  },
  {
    "id": "06-users-follow-and-block-08-user-profile-card",
    "category": "Users Follow and Block",
    "title": "User Profile Card",
    "topicIds": [
      "function-social-finding-account-id",
      "function-relationships-not-showing"
    ],
    "images": [
      {
        "src": "./assets/screenshots/06_Users_Follow_and_Block/08_User_Profile_Card/01_08_User_Profile_Card.png",
        "step": 1,
        "alt": "User Profile Card — step 1",
        "captionEn": "Visual reference — User Profile Card",
        "captionAr": "مرجع مرئي — User Profile Card"
      }
    ]
  },
  {
    "id": "07-gifts-and-messages-01-gift-message",
    "category": "Gifts and Messages",
    "title": "Gift Message",
    "topicIds": [
      "function-social-coins-deducted-messages",
      "function-social-transfer-gifts"
    ],
    "images": [
      {
        "src": "./assets/screenshots/07_Gifts_and_Messages/01_Gift_Message/01_01_Gift_Message.png",
        "step": 1,
        "alt": "Gift Message — step 1",
        "captionEn": "Visual reference — Gift Message",
        "captionAr": "مرجع مرئي — Gift Message"
      }
    ]
  },
  {
    "id": "07-gifts-and-messages-02-transfer-gift-to-backpack",
    "category": "Gifts and Messages",
    "title": "Transfer Gift to Backpack",
    "topicIds": [
      "function-social-transfer-gifts"
    ],
    "images": [
      {
        "src": "./assets/screenshots/07_Gifts_and_Messages/02_Transfer_Gift_to_Backpack/01_02_Transfer_Gift_to_Backpack.png",
        "step": 1,
        "alt": "Transfer Gift to Backpack — step 1",
        "captionEn": "Visual reference — Transfer Gift to Backpack",
        "captionAr": "مرجع مرئي — Transfer Gift to Backpack"
      }
    ]
  },
  {
    "id": "08-relationships-01-select-cp-relationship",
    "category": "Relationships",
    "title": "Select CP Relationship",
    "topicIds": [
      "function-relationships-creating"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/01_Select_CP_Relationship/01_01_Select_CP_Relationship.png",
        "step": 1,
        "alt": "Select CP Relationship — step 1",
        "captionEn": "Visual reference — Select CP Relationship",
        "captionAr": "مرجع مرئي — Select CP Relationship"
      }
    ]
  },
  {
    "id": "08-relationships-02-select-friend-relationship",
    "category": "Relationships",
    "title": "Select Friend Relationship",
    "topicIds": [
      "function-relationships-creating"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/02_Select_Friend_Relationship/01_02_Select_Friend_Relationship.png",
        "step": 1,
        "alt": "Select Friend Relationship — step 1",
        "captionEn": "Visual reference — Select Friend Relationship",
        "captionAr": "مرجع مرئي — Select Friend Relationship"
      }
    ]
  },
  {
    "id": "08-relationships-03-relationship-invitation",
    "category": "Relationships",
    "title": "Relationship Invitation",
    "topicIds": [
      "function-relationships-creating"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/03_Relationship_Invitation/01_03_Relationship_Invitation.png",
        "step": 1,
        "alt": "Relationship Invitation — step 1",
        "captionEn": "Visual reference — Relationship Invitation",
        "captionAr": "مرجع مرئي — Relationship Invitation"
      }
    ]
  },
  {
    "id": "08-relationships-04-relationship-benefits",
    "category": "Relationships",
    "title": "Relationship Benefits",
    "topicIds": [
      "function-relationships-creating",
      "function-relationships-guardian-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/04_Relationship_Benefits/01_04_Relationship_Benefits.png",
        "step": 1,
        "alt": "Relationship Benefits — step 1",
        "captionEn": "Visual reference — Relationship Benefits",
        "captionAr": "مرجع مرئي — Relationship Benefits"
      }
    ]
  },
  {
    "id": "08-relationships-05-relationship-profile-card",
    "category": "Relationships",
    "title": "Relationship Profile Card",
    "topicIds": [
      "function-relationships-not-showing"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/05_Relationship_Profile_Card/01_05_Relationship_Profile_Card.png",
        "step": 1,
        "alt": "Relationship Profile Card — step 1",
        "captionEn": "Visual reference — Relationship Profile Card",
        "captionAr": "مرجع مرئي — Relationship Profile Card"
      }
    ]
  },
  {
    "id": "08-relationships-06-relationship-details",
    "category": "Relationships",
    "title": "Relationship Details",
    "topicIds": [
      "function-relationships-creating"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/06_Relationship_Details/01_06_Relationship_Details.png",
        "step": 1,
        "alt": "Relationship Details — step 1",
        "captionEn": "Visual reference — Relationship Details",
        "captionAr": "مرجع مرئي — Relationship Details"
      }
    ]
  },
  {
    "id": "08-relationships-07-end-relationship-process",
    "category": "Relationships",
    "title": "End Relationship Process",
    "topicIds": [
      "function-relationships-ending"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/07_End_Relationship_Process/01_07_End_Relationship_Process.png",
        "step": 1,
        "alt": "End Relationship Process — step 1",
        "captionEn": "Step 1 of 3 — End Relationship Process",
        "captionAr": "الخطوة 1 من 3 — End Relationship Process"
      },
      {
        "src": "./assets/screenshots/08_Relationships/07_End_Relationship_Process/02_07_End_Relationship_Process.png",
        "step": 2,
        "alt": "End Relationship Process — step 2",
        "captionEn": "Step 2 of 3 — End Relationship Process",
        "captionAr": "الخطوة 2 من 3 — End Relationship Process"
      },
      {
        "src": "./assets/screenshots/08_Relationships/07_End_Relationship_Process/03_07_End_Relationship_Process.png",
        "step": 3,
        "alt": "End Relationship Process — step 3",
        "captionEn": "Step 3 of 3 — End Relationship Process",
        "captionAr": "الخطوة 3 من 3 — End Relationship Process"
      }
    ]
  },
  {
    "id": "08-relationships-08-relationship-profile",
    "category": "Relationships",
    "title": "Relationship Profile",
    "topicIds": [
      "function-relationships-not-showing"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/08_Relationship_Profile/01_08_Relationship_Profile.png",
        "step": 1,
        "alt": "Relationship Profile — step 1",
        "captionEn": "Visual reference — Relationship Profile",
        "captionAr": "مرجع مرئي — Relationship Profile"
      }
    ]
  },
  {
    "id": "08-relationships-09-terminate-relationship",
    "category": "Relationships",
    "title": "Terminate Relationship",
    "topicIds": [
      "function-relationships-ending"
    ],
    "images": [
      {
        "src": "./assets/screenshots/08_Relationships/09_Terminate_Relationship/01_09_Terminate_Relationship.png",
        "step": 1,
        "alt": "Terminate Relationship — step 1",
        "captionEn": "Visual reference — Terminate Relationship",
        "captionAr": "مرجع مرئي — Terminate Relationship"
      }
    ]
  },
  {
    "id": "09-guardianship-01-guardianship-privacy-toggle",
    "category": "Guardianship",
    "title": "Guardianship Privacy Toggle",
    "topicIds": [
      "function-relationships-hiding-guardianship"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/01_Guardianship_Privacy_Toggle/01_01_Guardianship_Privacy_Toggle.png",
        "step": 1,
        "alt": "Guardianship Privacy Toggle — step 1",
        "captionEn": "Visual reference — Guardianship Privacy Toggle",
        "captionAr": "مرجع مرئي — Guardianship Privacy Toggle"
      }
    ]
  },
  {
    "id": "09-guardianship-02-open-guardian-from-profile",
    "category": "Guardianship",
    "title": "Open Guardian from Profile",
    "topicIds": [
      "function-relationships-guarding-others"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/02_Open_Guardian_from_Profile/01_02_Open_Guardian_from_Profile.png",
        "step": 1,
        "alt": "Open Guardian from Profile — step 1",
        "captionEn": "Visual reference — Open Guardian from Profile",
        "captionAr": "مرجع مرئي — Open Guardian from Profile"
      }
    ]
  },
  {
    "id": "09-guardianship-03-guardian-pair-page",
    "category": "Guardianship",
    "title": "Guardian Pair Page",
    "topicIds": [
      "function-relationships-guardian-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/03_Guardian_Pair_Page/01_03_Guardian_Pair_Page.png",
        "step": 1,
        "alt": "Guardian Pair Page — step 1",
        "captionEn": "Visual reference — Guardian Pair Page",
        "captionAr": "مرجع مرئي — Guardian Pair Page"
      }
    ]
  },
  {
    "id": "09-guardianship-04-guard-user-button",
    "category": "Guardianship",
    "title": "Guard User Button",
    "topicIds": [
      "function-relationships-guarding-others"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/04_Guard_User_Button/01_04_Guard_User_Button.png",
        "step": 1,
        "alt": "Guard User Button — step 1",
        "captionEn": "Visual reference — Guard User Button",
        "captionAr": "مرجع مرئي — Guard User Button"
      }
    ]
  },
  {
    "id": "09-guardianship-05-guardian-request-page",
    "category": "Guardianship",
    "title": "Guardian Request Page",
    "topicIds": [
      "function-relationships-guarding-others"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/05_Guardian_Request_Page/01_05_Guardian_Request_Page.png",
        "step": 1,
        "alt": "Guardian Request Page — step 1",
        "captionEn": "Visual reference — Guardian Request Page",
        "captionAr": "مرجع مرئي — Guardian Request Page"
      }
    ]
  },
  {
    "id": "09-guardianship-06-guardian-profile",
    "category": "Guardianship",
    "title": "Guardian Profile",
    "topicIds": [
      "function-relationships-guardian-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/06_Guardian_Profile/01_06_Guardian_Profile.png",
        "step": 1,
        "alt": "Guardian Profile — step 1",
        "captionEn": "Visual reference — Guardian Profile",
        "captionAr": "مرجع مرئي — Guardian Profile"
      }
    ]
  },
  {
    "id": "09-guardianship-07-guardian-status-message",
    "category": "Guardianship",
    "title": "Guardian Status Message",
    "topicIds": [
      "function-relationships-guardian-points"
    ],
    "images": [
      {
        "src": "./assets/screenshots/09_Guardianship/07_Guardian_Status_Message/01_07_Guardian_Status_Message.png",
        "step": 1,
        "alt": "Guardian Status Message — step 1",
        "captionEn": "Visual reference — Guardian Status Message",
        "captionAr": "مرجع مرئي — Guardian Status Message"
      }
    ]
  },
  {
    "id": "10-family-01-open-family",
    "category": "Family",
    "title": "Open Family",
    "topicIds": [
      "function-family-actions-after-joining",
      "function-family-joining"
    ],
    "images": [
      {
        "src": "./assets/screenshots/10_Family/01_Open_Family/01_01_Open_Family.png",
        "step": 1,
        "alt": "Open Family — step 1",
        "captionEn": "Visual reference — Open Family",
        "captionAr": "مرجع مرئي — Open Family"
      }
    ]
  },
  {
    "id": "10-family-02-family-page",
    "category": "Family",
    "title": "Family Page",
    "topicIds": [
      "function-family-actions-after-joining"
    ],
    "images": [
      {
        "src": "./assets/screenshots/10_Family/02_Family_Page/01_02_Family_Page.png",
        "step": 1,
        "alt": "Family Page — step 1",
        "captionEn": "Visual reference — Family Page",
        "captionAr": "مرجع مرئي — Family Page"
      }
    ]
  },
  {
    "id": "10-family-03-family-settings",
    "category": "Family",
    "title": "Family Settings",
    "topicIds": [
      "function-family-hiding-info",
      "function-family-actions-after-joining"
    ],
    "images": [
      {
        "src": "./assets/screenshots/10_Family/03_Family_Settings/01_03_Family_Settings.png",
        "step": 1,
        "alt": "Family Settings — step 1",
        "captionEn": "Visual reference — Family Settings",
        "captionAr": "مرجع مرئي — Family Settings"
      }
    ]
  },
  {
    "id": "10-family-04-family-more-menu",
    "category": "Family",
    "title": "Family More Menu",
    "topicIds": [
      "function-family-actions-after-joining"
    ],
    "images": [
      {
        "src": "./assets/screenshots/10_Family/04_Family_More_Menu/01_04_Family_More_Menu.png",
        "step": 1,
        "alt": "Family More Menu — step 1",
        "captionEn": "Visual reference — Family More Menu",
        "captionAr": "مرجع مرئي — Family More Menu"
      }
    ]
  },
  {
    "id": "10-family-05-family-members-list",
    "category": "Family",
    "title": "Family Members List",
    "topicIds": [
      "function-family-actions-after-joining",
      "function-family-joining"
    ],
    "images": [
      {
        "src": "./assets/screenshots/10_Family/05_Family_Members_List/01_05_Family_Members_List.png",
        "step": 1,
        "alt": "Family Members List — step 1",
        "captionEn": "Step 1 of 2 — Family Members List",
        "captionAr": "الخطوة 1 من 2 — Family Members List"
      },
      {
        "src": "./assets/screenshots/10_Family/05_Family_Members_List/02_05_Family_Members_List.png",
        "step": 2,
        "alt": "Family Members List — step 2",
        "captionEn": "Step 2 of 2 — Family Members List",
        "captionAr": "الخطوة 2 من 2 — Family Members List"
      }
    ]
  },
  {
    "id": "10-family-06-family-entry-arabic",
    "category": "Family",
    "title": "Family Entry Arabic",
    "topicIds": [
      "function-family-joining",
      "function-family-creating"
    ],
    "images": [
      {
        "src": "./assets/screenshots/10_Family/06_Family_Entry_Arabic/01_06_Family_Entry_Arabic.png",
        "step": 1,
        "alt": "Family Entry Arabic — step 1",
        "captionEn": "Step 1 of 2 — Family Entry Arabic",
        "captionAr": "الخطوة 1 من 2 — Family Entry Arabic"
      },
      {
        "src": "./assets/screenshots/10_Family/06_Family_Entry_Arabic/02_06_Family_Entry_Arabic.png",
        "step": 2,
        "alt": "Family Entry Arabic — step 2",
        "captionEn": "Step 2 of 2 — Family Entry Arabic",
        "captionAr": "الخطوة 2 من 2 — Family Entry Arabic"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-01-switch-to-video-room",
    "category": "Rooms and Effects",
    "title": "Switch to Video Room",
    "topicIds": [
      "function-room-live-requirements",
      "function-host-single-video-mode"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/01_Switch_to_Video_Room/01_01_Switch_to_Video_Room.png",
        "step": 1,
        "alt": "Switch to Video Room — step 1",
        "captionEn": "Visual reference — Switch to Video Room",
        "captionAr": "مرجع مرئي — Switch to Video Room"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-02-video-room-layouts",
    "category": "Rooms and Effects",
    "title": "Video Room Layouts",
    "topicIds": [
      "function-host-single-video-mode",
      "function-room-adjust-mode"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/02_Video_Room_Layouts/01_02_Video_Room_Layouts.png",
        "step": 1,
        "alt": "Video Room Layouts — step 1",
        "captionEn": "Step 1 of 2 — Video Room Layouts",
        "captionAr": "الخطوة 1 من 2 — Video Room Layouts"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/02_Video_Room_Layouts/02_02_Video_Room_Layouts.png",
        "step": 2,
        "alt": "Video Room Layouts — step 2",
        "captionEn": "Step 2 of 2 — Video Room Layouts",
        "captionAr": "الخطوة 2 من 2 — Video Room Layouts"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-03-room-settings-steps",
    "category": "Rooms and Effects",
    "title": "Room Settings Steps",
    "topicIds": [
      "function-room-settings-adjustment"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/03_Room_Settings_Steps/01_03_Room_Settings_Steps.png",
        "step": 1,
        "alt": "Room Settings Steps — step 1",
        "captionEn": "Step 1 of 3 — Room Settings Steps",
        "captionAr": "الخطوة 1 من 3 — Room Settings Steps"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/03_Room_Settings_Steps/02_03_Room_Settings_Steps.png",
        "step": 2,
        "alt": "Room Settings Steps — step 2",
        "captionEn": "Step 2 of 3 — Room Settings Steps",
        "captionAr": "الخطوة 2 من 3 — Room Settings Steps"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/03_Room_Settings_Steps/03_03_Room_Settings_Steps.png",
        "step": 3,
        "alt": "Room Settings Steps — step 3",
        "captionEn": "Step 3 of 3 — Room Settings Steps",
        "captionAr": "الخطوة 3 من 3 — Room Settings Steps"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-04-room-main-screen",
    "category": "Rooms and Effects",
    "title": "Room Main Screen",
    "topicIds": [
      "function-room-creating-personal"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/04_Room_Main_Screen/01_04_Room_Main_Screen.png",
        "step": 1,
        "alt": "Room Main Screen — step 1",
        "captionEn": "Visual reference — Room Main Screen",
        "captionAr": "مرجع مرئي — Room Main Screen"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-05-room-mode-steps",
    "category": "Rooms and Effects",
    "title": "Room Mode Steps",
    "topicIds": [
      "function-room-adjust-mode"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/05_Room_Mode_Steps/01_05_Room_Mode_Steps.png",
        "step": 1,
        "alt": "Room Mode Steps — step 1",
        "captionEn": "Step 1 of 3 — Room Mode Steps",
        "captionAr": "الخطوة 1 من 3 — Room Mode Steps"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/05_Room_Mode_Steps/02_05_Room_Mode_Steps.png",
        "step": 2,
        "alt": "Room Mode Steps — step 2",
        "captionEn": "Step 2 of 3 — Room Mode Steps",
        "captionAr": "الخطوة 2 من 3 — Room Mode Steps"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/05_Room_Mode_Steps/03_05_Room_Mode_Steps.png",
        "step": 3,
        "alt": "Room Mode Steps — step 3",
        "captionEn": "Step 3 of 3 — Room Mode Steps",
        "captionAr": "الخطوة 3 من 3 — Room Mode Steps"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-06-room-interface",
    "category": "Rooms and Effects",
    "title": "Room Interface",
    "topicIds": [
      "function-room-creating-personal"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/06_Room_Interface/01_06_Room_Interface.png",
        "step": 1,
        "alt": "Room Interface — step 1",
        "captionEn": "Visual reference — Room Interface",
        "captionAr": "مرجع مرئي — Room Interface"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-07-special-effects-setting",
    "category": "Rooms and Effects",
    "title": "Special Effects Setting",
    "topicIds": [
      "function-room-gift-effects-not-visible",
      "payment-decoration-entry-effect"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/07_Special_Effects_Setting/01_07_Special_Effects_Setting.png",
        "step": 1,
        "alt": "Special Effects Setting — step 1",
        "captionEn": "Visual reference — Special Effects Setting",
        "captionAr": "مرجع مرئي — Special Effects Setting"
      }
    ]
  },
  {
    "id": "11-rooms-and-effects-08-apply-room-effects",
    "category": "Rooms and Effects",
    "title": "Apply Room Effects",
    "topicIds": [
      "function-room-gift-effects-not-visible",
      "payment-decoration-entry-effect"
    ],
    "images": [
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/08_Apply_Room_Effects/01_08_Apply_Room_Effects.png",
        "step": 1,
        "alt": "Apply Room Effects — step 1",
        "captionEn": "Step 1 of 3 — Apply Room Effects",
        "captionAr": "الخطوة 1 من 3 — Apply Room Effects"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/08_Apply_Room_Effects/02_08_Apply_Room_Effects.png",
        "step": 2,
        "alt": "Apply Room Effects — step 2",
        "captionEn": "Step 2 of 3 — Apply Room Effects",
        "captionAr": "الخطوة 2 من 3 — Apply Room Effects"
      },
      {
        "src": "./assets/screenshots/11_Rooms_and_Effects/08_Apply_Room_Effects/03_08_Apply_Room_Effects.png",
        "step": 3,
        "alt": "Apply Room Effects — step 3",
        "captionEn": "Step 3 of 3 — Apply Room Effects",
        "captionAr": "الخطوة 3 من 3 — Apply Room Effects"
      }
    ]
  },
  {
    "id": "12-room-tasks-01-bronze-silver-gold-room-tags",
    "category": "Room Tasks",
    "title": "Bronze Silver Gold Room Tags",
    "topicIds": [
      "function-room-obtaining-tags"
    ],
    "images": [
      {
        "src": "./assets/screenshots/12_Room_Tasks/01_Bronze_Silver_Gold_Room_Tags/01_01_Bronze_Silver_Gold_Room_Tags.png",
        "step": 1,
        "alt": "Bronze Silver Gold Room Tags — step 1",
        "captionEn": "Step 1 of 5 — Bronze Silver Gold Room Tags",
        "captionAr": "الخطوة 1 من 5 — Bronze Silver Gold Room Tags"
      },
      {
        "src": "./assets/screenshots/12_Room_Tasks/01_Bronze_Silver_Gold_Room_Tags/02_01_Bronze_Silver_Gold_Room_Tags.png",
        "step": 2,
        "alt": "Bronze Silver Gold Room Tags — step 2",
        "captionEn": "Step 2 of 5 — Bronze Silver Gold Room Tags",
        "captionAr": "الخطوة 2 من 5 — Bronze Silver Gold Room Tags"
      },
      {
        "src": "./assets/screenshots/12_Room_Tasks/01_Bronze_Silver_Gold_Room_Tags/03_01_Bronze_Silver_Gold_Room_Tags.png",
        "step": 3,
        "alt": "Bronze Silver Gold Room Tags — step 3",
        "captionEn": "Step 3 of 5 — Bronze Silver Gold Room Tags",
        "captionAr": "الخطوة 3 من 5 — Bronze Silver Gold Room Tags"
      },
      {
        "src": "./assets/screenshots/12_Room_Tasks/01_Bronze_Silver_Gold_Room_Tags/04_01_Bronze_Silver_Gold_Room_Tags.png",
        "step": 4,
        "alt": "Bronze Silver Gold Room Tags — step 4",
        "captionEn": "Step 4 of 5 — Bronze Silver Gold Room Tags",
        "captionAr": "الخطوة 4 من 5 — Bronze Silver Gold Room Tags"
      },
      {
        "src": "./assets/screenshots/12_Room_Tasks/01_Bronze_Silver_Gold_Room_Tags/05_01_Bronze_Silver_Gold_Room_Tags.png",
        "step": 5,
        "alt": "Bronze Silver Gold Room Tags — step 5",
        "captionEn": "Step 5 of 5 — Bronze Silver Gold Room Tags",
        "captionAr": "الخطوة 5 من 5 — Bronze Silver Gold Room Tags"
      }
    ]
  },
  {
    "id": "12-room-tasks-02-daily-room-activity-tasks",
    "category": "Room Tasks",
    "title": "Daily Room Activity Tasks",
    "topicIds": [
      "function-tasks-room-details",
      "function-tasks-weekly-room-availability"
    ],
    "images": [
      {
        "src": "./assets/screenshots/12_Room_Tasks/02_Daily_Room_Activity_Tasks/01_02_Daily_Room_Activity_Tasks.png",
        "step": 1,
        "alt": "Daily Room Activity Tasks — step 1",
        "captionEn": "Visual reference — Daily Room Activity Tasks",
        "captionAr": "مرجع مرئي — Daily Room Activity Tasks"
      }
    ]
  },
  {
    "id": "13-chat-and-host-settings-01-quick-greetings-setting",
    "category": "Chat and Host Settings",
    "title": "Quick Greetings Setting",
    "topicIds": [
      "function-host-quick-greetings"
    ],
    "images": [
      {
        "src": "./assets/screenshots/13_Chat_and_Host_Settings/01_Quick_Greetings_Setting/01_01_Quick_Greetings_Setting.png",
        "step": 1,
        "alt": "Quick Greetings Setting — step 1",
        "captionEn": "Visual reference — Quick Greetings Setting",
        "captionAr": "مرجع مرئي — Quick Greetings Setting"
      }
    ]
  },
  {
    "id": "13-chat-and-host-settings-02-chat-growth-menu",
    "category": "Chat and Host Settings",
    "title": "Chat Growth Menu",
    "topicIds": [
      "function-social-chat-points-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/13_Chat_and_Host_Settings/02_Chat_Growth_Menu/01_02_Chat_Growth_Menu.png",
        "step": 1,
        "alt": "Chat Growth Menu — step 1",
        "captionEn": "Visual reference — Chat Growth Menu",
        "captionAr": "مرجع مرئي — Chat Growth Menu"
      }
    ]
  },
  {
    "id": "13-chat-and-host-settings-03-open-me-for-host-settings",
    "category": "Chat and Host Settings",
    "title": "Open ME for Host Settings",
    "topicIds": [
      "function-host-becoming-host-agency"
    ],
    "images": [
      {
        "src": "./assets/screenshots/13_Chat_and_Host_Settings/03_Open_ME_for_Host_Settings/01_03_Open_ME_for_Host_Settings.png",
        "step": 1,
        "alt": "Open ME for Host Settings — step 1",
        "captionEn": "Visual reference — Open ME for Host Settings",
        "captionAr": "مرجع مرئي — Open ME for Host Settings"
      }
    ]
  },
  {
    "id": "13-chat-and-host-settings-04-chat-star",
    "category": "Chat and Host Settings",
    "title": "Chat Star",
    "topicIds": [
      "function-social-chat-points-decrease",
      "function-social-chat-points-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/13_Chat_and_Host_Settings/04_Chat_Star/01_04_Chat_Star.png",
        "step": 1,
        "alt": "Chat Star — step 1",
        "captionEn": "Visual reference — Chat Star",
        "captionAr": "مرجع مرئي — Chat Star"
      }
    ]
  },
  {
    "id": "13-chat-and-host-settings-05-vip-status-entry",
    "category": "Chat and Host Settings",
    "title": "VIP Status Entry",
    "topicIds": [
      "payment-vip-overview",
      "payment-svip-privileges"
    ],
    "images": [
      {
        "src": "./assets/screenshots/13_Chat_and_Host_Settings/05_VIP_Status_Entry/01_05_VIP_Status_Entry.png",
        "step": 1,
        "alt": "VIP Status Entry — step 1",
        "captionEn": "Visual reference — VIP Status Entry",
        "captionAr": "مرجع مرئي — VIP Status Entry"
      }
    ]
  },
  {
    "id": "13-chat-and-host-settings-06-message-price-setting",
    "category": "Chat and Host Settings",
    "title": "Message Price Setting",
    "topicIds": [
      "function-host-message-price"
    ],
    "images": [
      {
        "src": "./assets/screenshots/13_Chat_and_Host_Settings/06_Message_Price_Setting/01_06_Message_Price_Setting.png",
        "step": 1,
        "alt": "Message Price Setting — step 1",
        "captionEn": "Visual reference — Message Price Setting",
        "captionAr": "مرجع مرئي — Message Price Setting"
      }
    ]
  },
  {
    "id": "14-agency-management-01-my-agency-page",
    "category": "Agency Management",
    "title": "My Agency Page",
    "topicIds": [
      "senior-cs-agency-management"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/01_My_Agency_Page/01_01_My_Agency_Page.png",
        "step": 1,
        "alt": "My Agency Page — step 1",
        "captionEn": "Visual reference — My Agency Page",
        "captionAr": "مرجع مرئي — My Agency Page"
      }
    ]
  },
  {
    "id": "14-agency-management-02-invite-hosts-to-agency",
    "category": "Agency Management",
    "title": "Invite Hosts to Agency",
    "topicIds": [
      "function-host-becoming-host-agency",
      "senior-cs-agency-management"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/02_Invite_Hosts_to_Agency/01_02_Invite_Hosts_to_Agency.png",
        "step": 1,
        "alt": "Invite Hosts to Agency — step 1",
        "captionEn": "Visual reference — Invite Hosts to Agency",
        "captionAr": "مرجع مرئي — Invite Hosts to Agency"
      }
    ]
  },
  {
    "id": "14-agency-management-03-approve-agency-application",
    "category": "Agency Management",
    "title": "Approve Agency Application",
    "topicIds": [
      "senior-cs-agency-activation",
      "function-host-anchor-application-rejected"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/03_Approve_Agency_Application/01_03_Approve_Agency_Application.png",
        "step": 1,
        "alt": "Approve Agency Application — step 1",
        "captionEn": "Visual reference — Approve Agency Application",
        "captionAr": "مرجع مرئي — Approve Agency Application"
      }
    ]
  },
  {
    "id": "14-agency-management-04-agency-dashboard",
    "category": "Agency Management",
    "title": "Agency Dashboard",
    "topicIds": [
      "senior-cs-agency-management"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/04_Agency_Dashboard/01_04_Agency_Dashboard.png",
        "step": 1,
        "alt": "Agency Dashboard — step 1",
        "captionEn": "Visual reference — Agency Dashboard",
        "captionAr": "مرجع مرئي — Agency Dashboard"
      }
    ]
  },
  {
    "id": "14-agency-management-05-agency-anchor-list",
    "category": "Agency Management",
    "title": "Agency Anchor List",
    "topicIds": [
      "senior-cs-agency-management"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/05_Agency_Anchor_List/01_05_Agency_Anchor_List.png",
        "step": 1,
        "alt": "Agency Anchor List — step 1",
        "captionEn": "Visual reference — Agency Anchor List",
        "captionAr": "مرجع مرئي — Agency Anchor List"
      }
    ]
  },
  {
    "id": "14-agency-management-06-anchor-rejection-reason",
    "category": "Agency Management",
    "title": "Anchor Rejection Reason",
    "topicIds": [
      "function-host-anchor-application-rejected"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/06_Anchor_Rejection_Reason/01_06_Anchor_Rejection_Reason.png",
        "step": 1,
        "alt": "Anchor Rejection Reason — step 1",
        "captionEn": "Step 1 of 2 — Anchor Rejection Reason",
        "captionAr": "الخطوة 1 من 2 — Anchor Rejection Reason"
      },
      {
        "src": "./assets/screenshots/14_Agency_Management/06_Anchor_Rejection_Reason/02_06_Anchor_Rejection_Reason.png",
        "step": 2,
        "alt": "Anchor Rejection Reason — step 2",
        "captionEn": "Step 2 of 2 — Anchor Rejection Reason",
        "captionAr": "الخطوة 2 من 2 — Anchor Rejection Reason"
      }
    ]
  },
  {
    "id": "14-agency-management-07-invite-sub-agency",
    "category": "Agency Management",
    "title": "Invite Sub Agency",
    "topicIds": [
      "senior-cs-sub-agency",
      "sv-refined-create-sub-agency"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/07_Invite_Sub_Agency/01_07_Invite_Sub_Agency.png",
        "step": 1,
        "alt": "Invite Sub Agency — step 1",
        "captionEn": "Step 1 of 3 — Invite Sub Agency",
        "captionAr": "الخطوة 1 من 3 — Invite Sub Agency"
      },
      {
        "src": "./assets/screenshots/14_Agency_Management/07_Invite_Sub_Agency/02_07_Invite_Sub_Agency.png",
        "step": 2,
        "alt": "Invite Sub Agency — step 2",
        "captionEn": "Step 2 of 3 — Invite Sub Agency",
        "captionAr": "الخطوة 2 من 3 — Invite Sub Agency"
      },
      {
        "src": "./assets/screenshots/14_Agency_Management/07_Invite_Sub_Agency/03_07_Invite_Sub_Agency.png",
        "step": 3,
        "alt": "Invite Sub Agency — step 3",
        "captionEn": "Step 3 of 3 — Invite Sub Agency",
        "captionAr": "الخطوة 3 من 3 — Invite Sub Agency"
      }
    ]
  },
  {
    "id": "14-agency-management-08-agency-commission",
    "category": "Agency Management",
    "title": "Agency Commission",
    "topicIds": [
      "senior-cs-commission-targets"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/08_Agency_Commission/01_08_Agency_Commission.png",
        "step": 1,
        "alt": "Agency Commission — step 1",
        "captionEn": "Visual reference — Agency Commission",
        "captionAr": "مرجع مرئي — Agency Commission"
      }
    ]
  },
  {
    "id": "14-agency-management-09-agency-task-progress",
    "category": "Agency Management",
    "title": "Agency Task Progress",
    "topicIds": [
      "senior-cs-agency-tasks"
    ],
    "images": [
      {
        "src": "./assets/screenshots/14_Agency_Management/09_Agency_Task_Progress/01_09_Agency_Task_Progress.png",
        "step": 1,
        "alt": "Agency Task Progress — step 1",
        "captionEn": "Visual reference — Agency Task Progress",
        "captionAr": "مرجع مرئي — Agency Task Progress"
      }
    ]
  },
  {
    "id": "15-games-and-events-01-game-home-and-event-screens",
    "category": "Games and Events",
    "title": "Game Home and Event Screens",
    "topicIds": [
      "function-cot-overview",
      "game-center"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/01_Game_Home_and_Event_Screens/01_01_Game_Home_and_Event_Screens.png",
        "step": 1,
        "alt": "Game Home and Event Screens — step 1",
        "captionEn": "Step 1 of 3 — Game Home and Event Screens",
        "captionAr": "الخطوة 1 من 3 — Game Home and Event Screens"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/01_Game_Home_and_Event_Screens/02_01_Game_Home_and_Event_Screens.png",
        "step": 2,
        "alt": "Game Home and Event Screens — step 2",
        "captionEn": "Step 2 of 3 — Game Home and Event Screens",
        "captionAr": "الخطوة 2 من 3 — Game Home and Event Screens"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/01_Game_Home_and_Event_Screens/03_01_Game_Home_and_Event_Screens.png",
        "step": 3,
        "alt": "Game Home and Event Screens — step 3",
        "captionEn": "Step 3 of 3 — Game Home and Event Screens",
        "captionAr": "الخطوة 3 من 3 — Game Home and Event Screens"
      }
    ]
  },
  {
    "id": "15-games-and-events-02-castle-upgrade-steps",
    "category": "Games and Events",
    "title": "Castle Upgrade Steps",
    "topicIds": [
      "function-cot-upgrading-castle"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/02_Castle_Upgrade_Steps/01_02_Castle_Upgrade_Steps.png",
        "step": 1,
        "alt": "Castle Upgrade Steps — step 1",
        "captionEn": "Step 1 of 4 — Castle Upgrade Steps",
        "captionAr": "الخطوة 1 من 4 — Castle Upgrade Steps"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/02_Castle_Upgrade_Steps/02_02_Castle_Upgrade_Steps.png",
        "step": 2,
        "alt": "Castle Upgrade Steps — step 2",
        "captionEn": "Step 2 of 4 — Castle Upgrade Steps",
        "captionAr": "الخطوة 2 من 4 — Castle Upgrade Steps"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/02_Castle_Upgrade_Steps/03_02_Castle_Upgrade_Steps.png",
        "step": 3,
        "alt": "Castle Upgrade Steps — step 3",
        "captionEn": "Step 3 of 4 — Castle Upgrade Steps",
        "captionAr": "الخطوة 3 من 4 — Castle Upgrade Steps"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/02_Castle_Upgrade_Steps/04_02_Castle_Upgrade_Steps.png",
        "step": 4,
        "alt": "Castle Upgrade Steps — step 4",
        "captionEn": "Step 4 of 4 — Castle Upgrade Steps",
        "captionAr": "الخطوة 4 من 4 — Castle Upgrade Steps"
      }
    ]
  },
  {
    "id": "15-games-and-events-03-treasure-chest-progress",
    "category": "Games and Events",
    "title": "Treasure Chest Progress",
    "topicIds": [
      "function-cot-treasure-keys",
      "function-cot-automatic-chest"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/03_Treasure_Chest_Progress/01_03_Treasure_Chest_Progress.png",
        "step": 1,
        "alt": "Treasure Chest Progress — step 1",
        "captionEn": "Visual reference — Treasure Chest Progress",
        "captionAr": "مرجع مرئي — Treasure Chest Progress"
      }
    ]
  },
  {
    "id": "15-games-and-events-04-castle-main-screen",
    "category": "Games and Events",
    "title": "Castle Main Screen",
    "topicIds": [
      "function-cot-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/04_Castle_Main_Screen/01_04_Castle_Main_Screen.png",
        "step": 1,
        "alt": "Castle Main Screen — step 1",
        "captionEn": "Visual reference — Castle Main Screen",
        "captionAr": "مرجع مرئي — Castle Main Screen"
      }
    ]
  },
  {
    "id": "15-games-and-events-05-in-game-customer-service",
    "category": "Games and Events",
    "title": "In Game Customer Service",
    "topicIds": [
      "function-cot-overview",
      "function-games-crashing"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/05_In_Game_Customer_Service/01_05_In_Game_Customer_Service.png",
        "step": 1,
        "alt": "In Game Customer Service — step 1",
        "captionEn": "Visual reference — In Game Customer Service",
        "captionAr": "مرجع مرئي — In Game Customer Service"
      }
    ]
  },
  {
    "id": "15-games-and-events-06-alliance-chest",
    "category": "Games and Events",
    "title": "Alliance Chest",
    "topicIds": [
      "function-cot-alliances-overview"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/06_Alliance_Chest/01_06_Alliance_Chest.png",
        "step": 1,
        "alt": "Alliance Chest — step 1",
        "captionEn": "Visual reference — Alliance Chest",
        "captionAr": "مرجع مرئي — Alliance Chest"
      }
    ]
  },
  {
    "id": "15-games-and-events-07-join-or-create-alliance",
    "category": "Games and Events",
    "title": "Join or Create Alliance",
    "topicIds": [
      "function-cot-alliances-overview",
      "function-cot-unable-join-alliance"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/07_Join_or_Create_Alliance/01_07_Join_or_Create_Alliance.png",
        "step": 1,
        "alt": "Join or Create Alliance — step 1",
        "captionEn": "Visual reference — Join or Create Alliance",
        "captionAr": "مرجع مرئي — Join or Create Alliance"
      }
    ]
  },
  {
    "id": "15-games-and-events-08-in-game-chat",
    "category": "Games and Events",
    "title": "In Game Chat",
    "topicIds": [
      "function-cot-in-game-chat"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/08_In_Game_Chat/01_08_In_Game_Chat.png",
        "step": 1,
        "alt": "In Game Chat — step 1",
        "captionEn": "Step 1 of 2 — In Game Chat",
        "captionAr": "الخطوة 1 من 2 — In Game Chat"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/08_In_Game_Chat/02_08_In_Game_Chat.png",
        "step": 2,
        "alt": "In Game Chat — step 2",
        "captionEn": "Step 2 of 2 — In Game Chat",
        "captionAr": "الخطوة 2 من 2 — In Game Chat"
      }
    ]
  },
  {
    "id": "15-games-and-events-09-constellation-levels",
    "category": "Games and Events",
    "title": "Constellation Levels",
    "topicIds": [
      "function-cot-improving-combat-power",
      "function-cot-starlight"
    ],
    "images": [
      {
        "src": "./assets/screenshots/15_Games_and_Events/09_Constellation_Levels/01_09_Constellation_Levels.png",
        "step": 1,
        "alt": "Constellation Levels — step 1",
        "captionEn": "Step 1 of 2 — Constellation Levels",
        "captionAr": "الخطوة 1 من 2 — Constellation Levels"
      },
      {
        "src": "./assets/screenshots/15_Games_and_Events/09_Constellation_Levels/02_09_Constellation_Levels.png",
        "step": 2,
        "alt": "Constellation Levels — step 2",
        "captionEn": "Step 2 of 2 — Constellation Levels",
        "captionAr": "الخطوة 2 من 2 — Constellation Levels"
      }
    ]
  }
];
  const DEFAULT_WORKER_URL = "https://sugo.dwairy101.workers.dev";
  const staticGuides = guides;
  let guidesById = Object.create(null);
  let guidesByTopic = Object.create(null);
  let effectiveGuides = [];

  const remoteState = {
    loaded: false,
    loading: null,
    error: "",
    updatedAt: null,
    topics: Object.create(null)
  };

  function workerUrl() {
    return String(window.SUGO_WORKER_URL || DEFAULT_WORKER_URL).replace(/\/+$/, "");
  }

  function cleanText(value, max = 500) {
    return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max);
  }

  function clone(value) {
    if (typeof structuredClone === "function") {
      try { return structuredClone(value); } catch (_error) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeTopicId(value) {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") return String(value.id || value.paneId || "").trim();
    return "";
  }

  function normalizeImage(image, guideTitle, index) {
    if (!image || typeof image !== "object") return null;
    const src = cleanText(image.src, 3000);
    const storageKey = cleanText(image.storageKey, 1000);
    if (!src && !storageKey) return null;
    return {
      id: cleanText(image.id, 180) || `image-${index + 1}`,
      src,
      storageKey,
      mimeType: cleanText(image.mimeType, 100),
      fileName: cleanText(image.fileName, 300),
      step: index + 1,
      alt: cleanText(image.alt, 500) || `${guideTitle} — step ${index + 1}`,
      captionEn: cleanText(image.captionEn, 1200) || `Step ${index + 1} — ${guideTitle}`,
      captionAr: cleanText(image.captionAr, 1200) || `الخطوة ${index + 1} — ${guideTitle}`
    };
  }

  function normalizeGuide(guide, topicId, index) {
    if (!guide || typeof guide !== "object") return null;
    const title = cleanText(guide.title, 300) || "Visual Guide";
    const images = (Array.isArray(guide.images) ? guide.images : [])
      .map((image, imageIndex) => normalizeImage(image, title, imageIndex))
      .filter(Boolean);
    if (!images.length) return null;
    const id = cleanText(guide.id, 220) || `admin-${topicId}-${index + 1}`;
    return {
      id,
      category: cleanText(guide.category, 300) || "Visual Guides",
      title,
      topicIds: [topicId],
      images
    };
  }

  function normalizeRemoteTopics(topics) {
    const output = Object.create(null);
    if (!topics || typeof topics !== "object") return output;
    for (const [rawTopicId, entry] of Object.entries(topics)) {
      const topicId = normalizeTopicId(rawTopicId);
      if (!topicId) continue;
      const sourceGuides = Array.isArray(entry) ? entry : entry?.guides;
      output[topicId] = {
        updatedAt: cleanText(entry?.updatedAt, 100),
        guides: (Array.isArray(sourceGuides) ? sourceGuides : [])
          .map((guide, index) => normalizeGuide(guide, topicId, index))
          .filter(Boolean)
      };
    }
    return output;
  }

  function rebuildIndexes() {
    guidesByTopic = Object.create(null);

    for (const guide of staticGuides) {
      for (const topicId of guide.topicIds) {
        if (!guidesByTopic[topicId]) guidesByTopic[topicId] = [];
        guidesByTopic[topicId].push(guide);
      }
    }

    for (const [topicId, entry] of Object.entries(remoteState.topics)) {
      guidesByTopic[topicId] = entry.guides.slice();
    }

    guidesById = Object.create(null);
    const unique = new Map();
    for (const topicGuides of Object.values(guidesByTopic)) {
      for (const guide of topicGuides) {
        guidesById[guide.id] = guide;
        unique.set(guide.id, guide);
      }
    }
    effectiveGuides = [...unique.values()];
  }

  function dispatchMediaChange(source, topicId = "") {
    document.dispatchEvent(new CustomEvent("sugo:mediachange", {
      detail: { source, topicId, ...snapshot() }
    }));
  }

  function getGuide(guideId) {
    return guidesById[String(guideId || "").trim()] || null;
  }

  function getGuidesForTopic(topicId) {
    return (guidesByTopic[normalizeTopicId(topicId)] || []).slice();
  }

  function getGuidesForTopics(topics, limit = 6) {
    const output = [];
    const seen = new Set();
    for (const topic of Array.isArray(topics) ? topics : []) {
      const id = normalizeTopicId(topic);
      if (!id) continue;
      for (const guide of guidesByTopic[id] || []) {
        if (seen.has(guide.id)) continue;
        seen.add(guide.id);
        output.push(guide);
        if (output.length >= Math.max(1, Number(limit) || 6)) return output;
      }
    }
    return output;
  }

  function hasTopic(topicId) {
    return getGuidesForTopic(topicId).length > 0;
  }

  function hasTopicOverride(topicId) {
    return Object.prototype.hasOwnProperty.call(remoteState.topics, normalizeTopicId(topicId));
  }

  function getTopicOverride(topicId) {
    const entry = remoteState.topics[normalizeTopicId(topicId)];
    return entry ? clone(entry) : null;
  }

  function setTopicOverride(topicId, entry, { emit = true } = {}) {
    const id = normalizeTopicId(topicId);
    if (!id) return false;
    const normalized = normalizeRemoteTopics({ [id]: entry });
    remoteState.topics[id] = normalized[id] || { updatedAt: new Date().toISOString(), guides: [] };
    remoteState.loaded = true;
    rebuildIndexes();
    if (emit) dispatchMediaChange("topic-override", id);
    return true;
  }

  function clearTopicOverride(topicId, { emit = true } = {}) {
    const id = normalizeTopicId(topicId);
    if (!id) return false;
    delete remoteState.topics[id];
    rebuildIndexes();
    if (emit) dispatchMediaChange("topic-reset", id);
    return true;
  }

  async function readJsonResponse(response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      const error = new Error(payload?.error || `Media request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function loadRemote({ force = false } = {}) {
    if (remoteState.loaded && !force) return snapshot();
    if (remoteState.loading && !force) return remoteState.loading;
    remoteState.loading = (async () => {
      try {
        const response = await fetch(`${workerUrl()}/media?ts=${Date.now()}`, { cache: "no-store" });
        const payload = await readJsonResponse(response);
        remoteState.topics = normalizeRemoteTopics(payload.media?.topics || {});
        remoteState.updatedAt = payload.media?.updatedAt || null;
        remoteState.error = "";
        remoteState.loaded = true;
        rebuildIndexes();
        dispatchMediaChange("remote-load");
        return snapshot();
      } catch (error) {
        remoteState.error = error?.message || "Visual guides sync failed.";
        remoteState.loaded = true;
        rebuildIndexes();
        dispatchMediaChange("remote-error");
        return snapshot();
      } finally {
        remoteState.loading = null;
      }
    })();
    return remoteState.loading;
  }

  function snapshot() {
    const topicIds = Object.keys(guidesByTopic).filter((topicId) => guidesByTopic[topicId]?.length);
    return {
      loaded: remoteState.loaded,
      error: remoteState.error,
      updatedAt: remoteState.updatedAt,
      overrideCount: Object.keys(remoteState.topics).length,
      guideCount: effectiveGuides.length,
      imageCount: effectiveGuides.reduce((sum, guide) => sum + guide.images.length, 0),
      linkedTopicCount: topicIds.length
    };
  }

  rebuildIndexes();

  window.SUGO = window.SUGO || {};
  window.SUGO.KnowledgeBaseMedia = Object.freeze({
    version: "20260712-admin-media-v2",
    get guides() { return effectiveGuides.slice(); },
    get stats() { return Object.freeze(snapshot()); },
    getGuide,
    getGuidesForTopic,
    getGuidesForTopics,
    hasTopic,
    hasTopicOverride,
    getTopicOverride,
    setTopicOverride,
    clearTopicOverride,
    load: loadRemote,
    workerUrl
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void loadRemote(), { once: true });
  } else {
    void loadRemote();
  }
})();
