(() => {
  "use strict";

  const navigation = [
  {
    "id": "kb",
    "title": "SUGO Knowledgebase — MENA",
    "shortTitle": "SUGO Knowledge Base",
    "categories": [
      {
        "id": "operations-command-and-references",
        "title": "Operations Command & References",
        "sections": [
          {
            "id": "command-center-and-triage",
            "title": "Command Center & Triage",
            "topics": [
              {
                "id": "senior-cs-v51-command-center",
                "title": "Command Center"
              },
              {
                "id": "senior-cs-escalation-directory",
                "title": "Escalation Directory"
              },
              {
                "id": "senior-cs-missing-info-checklists",
                "title": "Missing Info Checklists"
              }
            ]
          },
          {
            "id": "backend-systems-and-reference-links",
            "title": "Backend Systems & Reference Links",
            "topics": [
              {
                "id": "senior-cs-backend-links-reference",
                "title": "Backend Links Reference"
              },
              {
                "id": "senior-cs-backend-system",
                "title": "Backend System"
              }
            ]
          },
          {
            "id": "agency-operations-reference",
            "title": "Agency Operations Reference",
            "topics": [
              {
                "id": "senior-cs-agency-activation",
                "title": "Agency Activation"
              },
              {
                "id": "senior-cs-agency-management",
                "title": "Agency Management"
              },
              {
                "id": "senior-cs-sub-agency",
                "title": "Sub-Agency"
              },
              {
                "id": "senior-cs-activities",
                "title": "Activities"
              }
            ]
          },
          {
            "id": "commission-tasks-and-ratings",
            "title": "Commission, Tasks & Ratings",
            "topics": [
              {
                "id": "senior-cs-commission-targets",
                "title": "Commission & Targets"
              },
              {
                "id": "senior-cs-agency-tasks",
                "title": "Agency Tasks"
              },
              {
                "id": "senior-cs-rating-groups",
                "title": "Agency Rating & Groups"
              }
            ]
          }
        ]
      },
      {
        "id": "account-access-and-identity",
        "title": "Account, Access & Identity",
        "sections": [
          {
            "id": "optimized-account-overview",
            "title": "Optimized Account Overview",
            "topics": [
              {
                "id": "account-support-optimized",
                "title": "Account Support Optimized"
              }
            ]
          },
          {
            "id": "registration-and-account-limits",
            "title": "Registration & Account Limits",
            "topics": [
              {
                "id": "account-register-signup",
                "title": "Account Sign-Up Guide"
              },
              {
                "id": "account-register-limits",
                "title": "Account Registration Limits"
              }
            ]
          },
          {
            "id": "login-password-and-device-access",
            "title": "Login, Password & Device Access",
            "topics": [
              {
                "id": "account-login-login",
                "title": "Account Login"
              },
              {
                "id": "account-login-issues",
                "title": "Login Issues and Troubleshooting"
              },
              {
                "id": "account-login-recovery",
                "title": "Password Recovery"
              },
              {
                "id": "account-login-phone",
                "title": "Linked Phone Number No Longer in Use"
              },
              {
                "id": "account-login-multidevice",
                "title": "Multi-Device Access"
              },
              {
                "id": "account-login-methods",
                "title": "Available Login Methods"
              }
            ]
          },
          {
            "id": "security-sms-and-phone-binding",
            "title": "Security, SMS & Phone Binding",
            "topics": [
              {
                "id": "account-security-sms",
                "title": "SMS Verification Not Received"
              },
              {
                "id": "account-security-reset",
                "title": "Password Reset Guide"
              },
              {
                "id": "account-security-link",
                "title": "Link Phone Number"
              },
              {
                "id": "account-security-recovery",
                "title": "Account Security and Recovery"
              },
              {
                "id": "account-security-stolen",
                "title": "Stolen / Compromised Account"
              }
            ]
          },
          {
            "id": "profile-location-and-privacy",
            "title": "Profile, Location & Privacy",
            "topics": [
              {
                "id": "account-profile-picture",
                "title": "Profile Picture Management"
              },
              {
                "id": "account-profile-nickname",
                "title": "Nickname Management"
              },
              {
                "id": "account-profile-gender",
                "title": "Account Gender Change"
              },
              {
                "id": "account-profile-location",
                "title": "Account Location and Country Settings"
              },
              {
                "id": "account-profile-distance",
                "title": "Distance Visibility Settings"
              }
            ]
          },
          {
            "id": "ban-appeal-and-account-deletion",
            "title": "Ban, Appeal & Account Deletion",
            "topics": [
              {
                "id": "account-ban-reasons",
                "title": "Account Ban Reasons"
              },
              {
                "id": "account-ban-unban",
                "title": "Account Unban and Appeal Process"
              },
              {
                "id": "account-ban-self-request",
                "title": "Account Self-Ban Request"
              },
              {
                "id": "account-ban-deletion",
                "title": "Account Deletion Guide"
              }
            ]
          }
        ]
      },
      {
        "id": "recharge-payment-and-privileges",
        "title": "Recharge, Payment & Privileges",
        "sections": [
          {
            "id": "optimized-payment-overview",
            "title": "Optimized Payment Overview",
            "topics": [
              {
                "id": "payment-support-optimized",
                "title": "Payment Support Optimized"
              }
            ]
          },
          {
            "id": "recharge-flow-channels-and-missing-coins",
            "title": "Recharge Flow, Channels & Missing Coins",
            "topics": [
              {
                "id": "payment-recharge-process",
                "title": "Recharge Process"
              },
              {
                "id": "payment-recharge-coin-sellers",
                "title": "Recharge via Coin Sellers"
              },
              {
                "id": "payment-recharge-link-availability",
                "title": "Recharge Link Availability"
              },
              {
                "id": "payment-recharge-remove-payment",
                "title": "Removing Saved Payment Details"
              },
              {
                "id": "recharge-failure-menu",
                "title": "Recharge Failure Issues"
              },
              {
                "id": "payment-recharge-missing-coins",
                "title": "Missing Coins After Recharge"
              },
              {
                "id": "payment-recharge-coin-history",
                "title": "Coin History Check"
              },
              {
                "id": "payment-recharge-currency-adjustment",
                "title": "Impact of Currency Adjustment on Account Balances and Levels"
              },
              {
                "id": "payment-recharge-dobi-balance",
                "title": "Checking Dobi Coin Balance"
              }
            ]
          },
          {
            "id": "diamonds-exchange-and-withdrawal-options",
            "title": "Diamonds, Exchange & Withdrawal Options",
            "topics": [
              {
                "id": "payment-diamonds-acquisition",
                "title": "Diamonds Acquisition"
              },
              {
                "id": "payment-diamonds-exchanging",
                "title": "Exchanging Diamonds for Coins"
              },
              {
                "id": "payment-diamonds-missing-exchange",
                "title": "Missing Diamond Exchange Option"
              },
              {
                "id": "payment-diamonds-withdrawal",
                "title": "Diamond Withdrawal Process"
              },
              {
                "id": "payment-diamonds-withdraw-button",
                "title": "Withdraw Button Not Visible"
              },
              {
                "id": "payment-diamonds-missing-quick",
                "title": "Missing Quick Withdrawal Option"
              },
              {
                "id": "payment-diamonds-remove-options",
                "title": "Removing Withdrawal or Exchange Options"
              }
            ]
          },
          {
            "id": "vip-privileges-and-cards",
            "title": "VIP Privileges & Cards",
            "topics": [
              {
                "id": "payment-vip-overview",
                "title": "VIP Overview"
              },
              {
                "id": "payment-vip-experience-card",
                "title": "Using VIP Experience Card"
              },
              {
                "id": "payment-vip-card-effect-svip",
                "title": "VIP Experience Card Effect on SVIP"
              },
              {
                "id": "payment-vip-unexpected-deduction",
                "title": "Unexpected VIP Points Deduction"
              }
            ]
          },
          {
            "id": "svip-levels-points-and-elite-club",
            "title": "SVIP Levels, Points & Elite Club",
            "topics": [
              {
                "id": "payment-svip-privileges",
                "title": "SVIP Privileges"
              },
              {
                "id": "payment-svip-becoming",
                "title": "Becoming an SVIP"
              },
              {
                "id": "payment-svip-degradation",
                "title": "SVIP Level Degradation"
              },
              {
                "id": "payment-svip-points",
                "title": "Acquiring and Using SVIP Points"
              },
              {
                "id": "payment-svip-level-requirements",
                "title": "SVIP Level Requirements"
              },
              {
                "id": "payment-svip-unexpected-deduction",
                "title": "Unexpected SVIP Points Deduction"
              },
              {
                "id": "payment-svip-dynamic-nickname",
                "title": "Obtaining Dynamic Nickname"
              },
              {
                "id": "payment-svip-unique-id",
                "title": "Acquiring Unique ID"
              },
              {
                "id": "payment-svip-elite-club",
                "title": "Joining the Elite Club"
              },
              {
                "id": "payment-svip-offline-recharge",
                "title": "Offline Recharge and VIP/SVIP/Elite Status"
              }
            ]
          },
          {
            "id": "aristocracy-invisibility-and-incognito",
            "title": "Aristocracy, Invisibility & Incognito",
            "topics": [
              {
                "id": "payment-aristocracy-overview",
                "title": "Aristocracy Overview and Acquisition"
              },
              {
                "id": "payment-aristocracy-invisibility",
                "title": "Obtaining Invisibility and Incognito"
              }
            ]
          },
          {
            "id": "decoration-frames-and-entry-effects",
            "title": "Decoration, Frames & Entry Effects",
            "topics": [
              {
                "id": "payment-decoration-acquiring",
                "title": "Acquiring Frames, Fantasy Cars or Entrance Vehicles"
              },
              {
                "id": "payment-decoration-equipping",
                "title": "Equipping or Changing Frames and Vehicles"
              },
              {
                "id": "payment-decoration-entry-effect",
                "title": "Entry Effect Not Visible After Equipping"
              }
            ]
          }
        ]
      },
      {
        "id": "social-moments-and-community",
        "title": "Social, Moments & Community",
        "sections": [
          {
            "id": "optimized-function-overview",
            "title": "Optimized Function Overview",
            "topics": [
              {
                "id": "function-support-optimized",
                "title": "Function Support Optimized"
              }
            ]
          },
          {
            "id": "user-search-ids-and-discovery",
            "title": "User Search, IDs & Discovery",
            "topics": [
              {
                "id": "function-social-searching-friends",
                "title": "Searching for Real-Life Friends"
              },
              {
                "id": "function-social-user-not-found",
                "title": "User Not Found by ID"
              },
              {
                "id": "function-social-finding-account-id",
                "title": "Finding Account ID"
              }
            ]
          },
          {
            "id": "messaging-chat-costs-and-chat-tools",
            "title": "Messaging, Chat Costs & Chat Tools",
            "topics": [
              {
                "id": "function-social-coins-deducted-messages",
                "title": "Coins Deducted for Messages"
              },
              {
                "id": "function-social-varying-coin-costs",
                "title": "Varying Coin Costs for Chat Messages"
              },
              {
                "id": "function-social-chatting-free",
                "title": "Chatting for Free"
              },
              {
                "id": "function-social-unable-send-messages",
                "title": "Unable to Send Messages"
              },
              {
                "id": "function-social-chat-background",
                "title": "Chat Background Settings"
              },
              {
                "id": "function-social-delete-chat-history",
                "title": "Deleting Chat History"
              },
              {
                "id": "function-social-translation-not-available",
                "title": "Message Translation Not Available"
              }
            ]
          },
          {
            "id": "following-blocking-and-reporting",
            "title": "Following, Blocking & Reporting",
            "topics": [
              {
                "id": "function-social-following-users",
                "title": "Following Other Users"
              },
              {
                "id": "function-social-cannot-follow-more",
                "title": "Cannot Follow More Users"
              },
              {
                "id": "function-social-unfollowing-users",
                "title": "Unfollowing Users"
              },
              {
                "id": "function-social-blocking-users",
                "title": "Blocking Users"
              },
              {
                "id": "function-social-blacklist-unblock",
                "title": "Accessing Blacklist and Unblocking"
              },
              {
                "id": "function-social-reporting",
                "title": "Reporting Behavior or Content"
              }
            ]
          },
          {
            "id": "chat-points-diamonds-and-gifts",
            "title": "Chat Points, Diamonds & Gifts",
            "topics": [
              {
                "id": "function-social-chat-points-overview",
                "title": "Chat Points Overview and Mechanics"
              },
              {
                "id": "function-social-chat-points-importance",
                "title": "Importance of Chat Points"
              },
              {
                "id": "function-social-chat-points-decrease",
                "title": "Chat Points Decrease Despite Chat Star Status"
              },
              {
                "id": "function-social-no-diamonds-replying",
                "title": "No Diamonds for Replying to Male Users"
              },
              {
                "id": "function-social-transfer-gifts",
                "title": "Transferring Gifts to User Backpack"
              }
            ]
          },
          {
            "id": "moments-and-comments",
            "title": "Moments & Comments",
            "topics": [
              {
                "id": "function-moments-posting-failure",
                "title": "Moment Posting Failure"
              },
              {
                "id": "function-moments-unable-comment",
                "title": "Unable to Comment on Moments"
              },
              {
                "id": "function-moments-profile-shows-zero",
                "title": "Profile Shows 0 Moments Despite Posts"
              }
            ]
          },
          {
            "id": "relationships-and-guardianship",
            "title": "Relationships & Guardianship",
            "topics": [
              {
                "id": "function-relationships-missing-call-voice",
                "title": "Missing Call and Voice Message Options"
              },
              {
                "id": "function-relationships-creating",
                "title": "Creating Relationships with Users"
              },
              {
                "id": "function-relationships-not-showing",
                "title": "Relationship Not Showing on Mini Card"
              },
              {
                "id": "function-relationships-ending",
                "title": "Ending a Relationship"
              },
              {
                "id": "function-relationships-guarding-others",
                "title": "Guarding Other Users"
              },
              {
                "id": "function-relationships-guardian-points",
                "title": "Guardian Points Explanation and Management"
              },
              {
                "id": "function-relationships-hiding-guardianship",
                "title": "Hiding Guardianship"
              },
              {
                "id": "function-relationships-ending-guardianship",
                "title": "Ending Guardianship"
              }
            ]
          },
          {
            "id": "family-features-and-tasks",
            "title": "Family Features & Tasks",
            "topics": [
              {
                "id": "function-family-actions-after-joining",
                "title": "Actions After Joining a Family"
              },
              {
                "id": "function-family-joining",
                "title": "Joining a Family"
              },
              {
                "id": "function-family-leaving",
                "title": "Leaving a Family"
              },
              {
                "id": "function-family-hiding-info",
                "title": "Hiding Family Information"
              },
              {
                "id": "function-family-creating",
                "title": "Creating a Family"
              },
              {
                "id": "function-family-missing-tasks",
                "title": "Missing Family or Daily Tasks"
              }
            ]
          }
        ]
      },
      {
        "id": "rooms-hosts-and-agency-operations",
        "title": "Rooms, Hosts & Agency Operations",
        "sections": [
          {
            "id": "room-creation-settings-and-room-tags",
            "title": "Room Creation, Settings & Room Tags",
            "topics": [
              {
                "id": "function-room-creating-personal",
                "title": "Creating Personal Room"
              },
              {
                "id": "function-room-live-requirements",
                "title": "Live/Video Room Opening Requirements"
              },
              {
                "id": "function-room-incorrect-password",
                "title": "Incorrect Room Password Error Resolution"
              },
              {
                "id": "function-room-settings-adjustment",
                "title": "Room Settings Adjustment"
              },
              {
                "id": "function-room-gif-cover",
                "title": "Setting GIF as Room Cover"
              },
              {
                "id": "function-room-adjust-mode",
                "title": "Adjusting Room Mode"
              },
              {
                "id": "function-room-obtaining-tags",
                "title": "Obtaining Room Tags (Bronze/Silver/Gold)"
              }
            ]
          },
          {
            "id": "room-live-sound-and-gift-issues",
            "title": "Room Live, Sound & Gift Issues",
            "topics": [
              {
                "id": "function-room-gift-effects-not-visible",
                "title": "Gift Effects Not Visible"
              },
              {
                "id": "function-room-unable-follow-live",
                "title": "Unable to Follow Live Room"
              },
              {
                "id": "function-room-mic-on-not-heard",
                "title": "Microphone On But Not Heard"
              },
              {
                "id": "function-room-no-sound",
                "title": "No Sound in Rooms"
              },
              {
                "id": "function-host-single-video-mode",
                "title": "Enabling Single Video Mode Live"
              }
            ]
          },
          {
            "id": "host-greetings-and-message-pricing",
            "title": "Host Greetings & Message Pricing",
            "topics": [
              {
                "id": "function-host-quick-greetings",
                "title": "Setting Quick Greetings for Matching"
              },
              {
                "id": "function-host-greeting-issues",
                "title": "Issues with Sending Greeting Messages"
              },
              {
                "id": "function-host-message-price",
                "title": "Setting Message Price"
              }
            ]
          },
          {
            "id": "host-verification-and-anchor-review",
            "title": "Host Verification & Anchor Review",
            "topics": [
              {
                "id": "function-host-gender-verification-failure",
                "title": "Gender/Profile Verification Failure"
              },
              {
                "id": "function-host-repeated-verification",
                "title": "Repeated Verification Requests"
              },
              {
                "id": "function-host-anchor-application-rejected",
                "title": "Anchor Application Rejected"
              }
            ]
          },
          {
            "id": "agency-entry-creation-and-transfer",
            "title": "Agency Entry, Creation & Transfer",
            "topics": [
              {
                "id": "function-host-becoming-host-agency",
                "title": "Becoming a Host or Joining Agency"
              },
              {
                "id": "function-host-agency-conditions-error",
                "title": "Agency Join Conditions Not Met Error"
              },
              {
                "id": "function-host-creating-agency",
                "title": "Creating Personal Agency"
              },
              {
                "id": "function-host-transfer-new-agency",
                "title": "Transferring to New Agency"
              },
              {
                "id": "function-host-blocked-multiple-accounts",
                "title": "Agency Join Blocked Due to Multiple Accounts"
              }
            ]
          },
          {
            "id": "host-withdrawal-options",
            "title": "Host Withdrawal Options",
            "topics": [
              {
                "id": "function-host-withdrawal-success-no-payment",
                "title": "Successful Withdrawal But No Payment Received"
              },
              {
                "id": "function-host-missing-withdrawal-option",
                "title": "Missing Withdrawal Option"
              },
              {
                "id": "function-host-missing-quick-withdrawal",
                "title": "Missing Quick Withdrawal Option"
              }
            ]
          }
        ]
      },
      {
        "id": "games-events-and-clash-of-thrones",
        "title": "Games, Events & Clash of Thrones",
        "sections": [
          {
            "id": "tasks-and-reward-tracking",
            "title": "Tasks & Reward Tracking",
            "topics": [
              {
                "id": "function-tasks-getting-free-coins",
                "title": "Getting Free Coins"
              },
              {
                "id": "function-tasks-daily-no-rewards",
                "title": "Daily Tasks Completed But No Rewards"
              },
              {
                "id": "function-tasks-monthly-diamond-target",
                "title": "Monthly Diamond Target Not Rewarded"
              },
              {
                "id": "function-tasks-room-details",
                "title": "Room Tasks Details"
              },
              {
                "id": "function-tasks-weekly-room-availability",
                "title": "Weekly Room Task Availability"
              }
            ]
          },
          {
            "id": "games-events-and-compensation",
            "title": "Games, Events & Compensation",
            "topics": [
              {
                "id": "function-games-no-reward",
                "title": "Event Participation Without Reward"
              },
              {
                "id": "function-games-crashing",
                "title": "App/Room/Game Crashing or Feature Issues"
              },
              {
                "id": "function-games-car-tycoon",
                "title": "Playing Car Tycoon Game"
              },
              {
                "id": "function-games-win-no-reward",
                "title": "Game Win Without Reward"
              },
              {
                "id": "function-games-manipulation-concerns",
                "title": "Game Results Manipulation Concerns"
              },
              {
                "id": "function-games-compensation-policy",
                "title": "Game Compensation Policy"
              },
              {
                "id": "function-games-whitelist-blacklist-request",
                "title": "Game Whitelist / Blacklist Request"
              }
            ]
          },
          {
            "id": "clash-of-thrones-basics-and-progression",
            "title": "Clash of Thrones — Basics & Progression",
            "topics": [
              {
                "id": "function-cot-overview",
                "title": "Clash of Thrones Game Overview"
              },
              {
                "id": "function-cot-improving-combat-power",
                "title": "Improving Combat Power"
              },
              {
                "id": "function-cot-treasure-keys",
                "title": "Obtaining Treasure Chest Keys"
              },
              {
                "id": "function-cot-ladder-ranking",
                "title": "Ladder Ranking System"
              },
              {
                "id": "function-cot-upgrading-castle",
                "title": "Upgrading Castle"
              },
              {
                "id": "function-cot-automatic-chest",
                "title": "Automatic Treasure Chest Opening"
              },
              {
                "id": "function-cot-starlight",
                "title": "Starlight Usage and Acquisition"
              }
            ]
          },
          {
            "id": "clash-of-thrones-alliance-and-guardian-beast",
            "title": "Clash of Thrones — Alliance & Guardian Beast",
            "topics": [
              {
                "id": "function-cot-alliances-overview",
                "title": "Alliances Overview and Joining/Creating"
              },
              {
                "id": "function-cot-unable-join-alliance",
                "title": "Unable to Join Alliance"
              },
              {
                "id": "function-cot-joining-alliance-group",
                "title": "Joining Alliance Group"
              },
              {
                "id": "function-cot-leaving-alliance",
                "title": "Leaving Alliance"
              },
              {
                "id": "function-cot-guardian-beast",
                "title": "Guardian Beast Explanation"
              },
              {
                "id": "function-cot-guardian-tickets",
                "title": "Obtaining Guardian Beast Summoning Tickets"
              },
              {
                "id": "function-cot-upgrading-city-defense",
                "title": "Upgrading City Defense"
              },
              {
                "id": "function-cot-in-game-chat",
                "title": "In-Game Chat in Clash of Thrones"
              },
              {
                "id": "function-cot-season-reset",
                "title": "Clash of Thrones New Season Reset"
              }
            ]
          },
          {
            "id": "game-level-overview",
            "title": "Game Level Overview",
            "topics": [
              {
                "id": "game-level-support-optimized",
                "title": "Game Level Optimized"
              }
            ]
          },
          {
            "id": "game-level-requirements",
            "title": "Game Level Requirements",
            "topics": [
              {
                "id": "game-greedy-cat",
                "title": "Greedy Cat"
              },
              {
                "id": "game-rocket-crash",
                "title": "Rocket Crash"
              },
              {
                "id": "game-multi-fishing",
                "title": "Multi Fishing"
              },
              {
                "id": "game-texas-cowboy",
                "title": "Texas Cowboy"
              },
              {
                "id": "game-center",
                "title": "Game Center"
              },
              {
                "id": "game-lion-tiger",
                "title": "Lion or Tiger"
              },
              {
                "id": "game-yummy",
                "title": "Yummy"
              },
              {
                "id": "game-greedy-dice",
                "title": "Greedy Dice"
              },
              {
                "id": "game-roulette",
                "title": "Roulette"
              },
              {
                "id": "game-slot-game",
                "title": "Slot Game"
              },
              {
                "id": "game-lucky-match",
                "title": "Lucky Match"
              },
              {
                "id": "game-ludo",
                "title": "Ludo – Play with Coins"
              }
            ]
          },
          {
            "id": "game-restrictions-and-blacklist",
            "title": "Game Restrictions & Blacklist",
            "topics": [
              {
                "id": "game-android-restrictions",
                "title": "Android Game Restrictions"
              },
              {
                "id": "game-permanent-restriction",
                "title": "Permanent Game Restriction"
              },
              {
                "id": "game-blacklist",
                "title": "Game Blacklist"
              }
            ]
          }
        ]
      },
      {
        "id": "withdrawal-transfer-and-exchange",
        "title": "Withdrawal, Transfer & Exchange",
        "sections": [
          {
            "id": "optimized-withdrawal-exchange-overview",
            "title": "Optimized Withdrawal / Exchange Overview",
            "topics": [
              {
                "id": "withdrawal-exchange-support-optimized",
                "title": "Withdrawal & Exchange Optimized"
              }
            ]
          },
          {
            "id": "withdrawal-eligibility-and-channels",
            "title": "Withdrawal Eligibility & Channels",
            "topics": [
              {
                "id": "level-withdrawal-threshold-option",
                "title": "Eligibility for Withdrawal Option"
              },
              {
                "id": "level-withdrawal-no-option",
                "title": "No Withdrawal Option Available"
              },
              {
                "id": "level-withdrawal-threshold-management",
                "title": "Eligibility for Withdrawal Through Management"
              },
              {
                "id": "level-withdrawal-entrance-no-quick",
                "title": "Withdrawal Entrance Available but No Quick Withdrawal Option"
              },
              {
                "id": "level-withdrawal-quick-channel-not-support",
                "title": "Quick Withdrawal Available but Specific Channel Not Supported"
              }
            ]
          },
          {
            "id": "withdrawal-option-management-and-cancellation",
            "title": "Withdrawal Option Management & Cancellation",
            "topics": [
              {
                "id": "level-withdrawal-remove-option",
                "title": "Remove Withdrawal / Exchange Option"
              },
              {
                "id": "level-withdrawal-add-option",
                "title": "Add Withdrawal / Exchange Option"
              },
              {
                "id": "level-withdrawal-cancel-pending",
                "title": "Cancel a Pending Withdrawal Request"
              }
            ]
          },
          {
            "id": "diamond-transfer-and-coin-exchange",
            "title": "Diamond Transfer & Coin Exchange",
            "topics": [
              {
                "id": "level-transfer-threshold-option",
                "title": "Eligibility for Diamond Transfer Option"
              },
              {
                "id": "level-exchange-threshold-option",
                "title": "Eligibility for Exchange Option"
              },
              {
                "id": "level-exchange-cannot-search-id",
                "title": "Unable to Search Another User's ID for Coin Exchange"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "sv",
    "title": "SUGO SV — Organized Support Macros",
    "shortTitle": "SUGO SV",
    "categories": [
      {
        "id": "sv-better-general-support-intake",
        "title": "General Support & Intake",
        "sections": [
          {
            "id": "sv-better-general-support-intake-greetings-first-response",
            "title": "Greetings & First Response",
            "topics": [
              {
                "id": "sv-refined-customer-service-greeting",
                "title": "Customer Service Greeting"
              },
              {
                "id": "sv-refined-welcome-how-can-we-help",
                "title": "Welcome / How Can We Help"
              }
            ]
          },
          {
            "id": "sv-better-general-support-intake-account-id-missing-info",
            "title": "Account ID & Missing Info",
            "topics": [
              {
                "id": "sv-refined-request-customer-id",
                "title": "Request Customer ID"
              },
              {
                "id": "sv-refined-request-id-and-issue-video",
                "title": "Request ID + Issue Video"
              },
              {
                "id": "sv-refined-contact-from-same-account",
                "title": "Ask to Contact From Same Account"
              }
            ]
          },
          {
            "id": "sv-better-general-support-intake-follow-up-conversation-handling",
            "title": "Follow-up & Conversation Handling",
            "topics": [
              {
                "id": "sv-refined-request-submitted-follow-up",
                "title": "Request Submitted / Follow-Up"
              },
              {
                "id": "sv-refined-duplicate-conversation",
                "title": "Duplicate Conversation"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-account-access-verification",
        "title": "Account Access & Verification",
        "sections": [
          {
            "id": "sv-better-account-access-verification-ownership-verification",
            "title": "Ownership Verification",
            "topics": [
              {
                "id": "sv-refined-account-ownership-verification",
                "title": "Account Ownership Verification"
              }
            ]
          },
          {
            "id": "sv-better-account-access-verification-phone-binding-password",
            "title": "Phone Binding & Password",
            "topics": [
              {
                "id": "sv-refined-phone-binding-request-submitted",
                "title": "Phone Binding Request Submitted"
              },
              {
                "id": "sv-refined-password-reset-request-submitted",
                "title": "Password Reset Request Submitted"
              }
            ]
          },
          {
            "id": "sv-better-account-access-verification-identity-review-verification",
            "title": "Identity Review & Verification",
            "topics": [
              {
                "id": "sv-refined-unban-identity-video",
                "title": "Identity Video Required"
              },
              {
                "id": "sv-refined-unban-review-male-using-female-account-video-sent",
                "title": "Review Sent: Male Using Female Account"
              },
              {
                "id": "sv-refined-unban-review-underage-verification-video-sent",
                "title": "Review Sent: Underage Verification"
              },
              {
                "id": "sv-refined-verification-rejected",
                "title": "Verification Rejected"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-reports-abuse-evidence",
        "title": "Reports, Abuse & Evidence",
        "sections": [
          {
            "id": "sv-better-reports-abuse-evidence-abuse-reports",
            "title": "Abuse Reports",
            "topics": [
              {
                "id": "sv-refined-report-abuse-case",
                "title": "Report Abuse Case"
              },
              {
                "id": "sv-refined-report-abuse-evidence",
                "title": "Report Abuse Evidence"
              },
              {
                "id": "sv-refined-report-insulting-management",
                "title": "Report Insulting Management"
              }
            ]
          },
          {
            "id": "sv-better-reports-abuse-evidence-technical-issue-evidence",
            "title": "Technical Issue Evidence",
            "topics": [
              {
                "id": "sv-refined-report-issue-case",
                "title": "Report Technical Issue"
              }
            ]
          },
          {
            "id": "sv-better-reports-abuse-evidence-moments-content-cleanup",
            "title": "Moments & Content Cleanup",
            "topics": [
              {
                "id": "sv-refined-moments-watermark-removal",
                "title": "Moments / Watermark Removal"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-ban-restriction-management",
        "title": "Ban & Restriction Management",
        "sections": [
          {
            "id": "sv-better-ban-restriction-management-general-ban-handling",
            "title": "General Ban Handling",
            "topics": [
              {
                "id": "sv-refined-ban-reason-placeholder",
                "title": "Ban Reason Placeholder"
              },
              {
                "id": "sv-refined-request-unban-apology",
                "title": "Request Unban / Apology"
              },
              {
                "id": "sv-refined-medium-risk-requirements",
                "title": "Medium Risk Requirements"
              },
              {
                "id": "sv-refined-high-risk-restriction",
                "title": "High-Risk Restriction"
              }
            ]
          },
          {
            "id": "sv-better-ban-restriction-management-identity-age-account-misuse",
            "title": "Identity / Age / Account Misuse",
            "topics": [
              {
                "id": "sv-refined-ban-male-using-female-account",
                "title": "Ban: Male Using Female Account"
              },
              {
                "id": "sv-refined-ban-underage-suspicion",
                "title": "Ban: Underage Suspicion"
              },
              {
                "id": "sv-refined-ban-vpn-region-violation",
                "title": "Ban: VPN / Region Violation"
              },
              {
                "id": "sv-refined-ban-external-contact-phone-number",
                "title": "Ban: External Contact / Phone Number"
              },
              {
                "id": "sv-refined-ban-external-contact-telegram",
                "title": "Ban: External Contact / Telegram"
              }
            ]
          },
          {
            "id": "sv-better-ban-restriction-management-sexual-policy-violations",
            "title": "Sexual Policy Violations",
            "topics": [
              {
                "id": "sv-refined-ban-sexual-commerce",
                "title": "Ban: Sexual Commerce"
              },
              {
                "id": "sv-refined-ban-sexual-content-in-messages",
                "title": "Ban: Sexual Content in Messages"
              },
              {
                "id": "sv-refined-ban-sexual-messages",
                "title": "Ban: Sexual Messages"
              },
              {
                "id": "sv-refined-ban-sexual-picture",
                "title": "Ban: Sexual Picture"
              },
              {
                "id": "sv-refined-ban-sexual-video",
                "title": "Ban: Sexual Video"
              },
              {
                "id": "sv-refined-ban-sexual-moments",
                "title": "Ban: Sexual Moments"
              },
              {
                "id": "sv-refined-ban-sexual-offer",
                "title": "Ban: Sexual Offer"
              }
            ]
          },
          {
            "id": "sv-better-ban-restriction-management-safety-prohibited-content",
            "title": "Safety & Prohibited Content",
            "topics": [
              {
                "id": "sv-refined-ban-smoking-during-live",
                "title": "Ban: Smoking During Live"
              },
              {
                "id": "sv-refined-ban-smoking-image",
                "title": "Ban: Smoking Image"
              },
              {
                "id": "sv-refined-ban-drug-use-during-live",
                "title": "Ban: Drug Use During Live"
              },
              {
                "id": "sv-refined-ban-drug-use-image",
                "title": "Ban: Drug Use Image"
              },
              {
                "id": "sv-refined-ban-weapon-during-live",
                "title": "Ban: Weapon During Live"
              },
              {
                "id": "sv-refined-ban-weapon-image",
                "title": "Ban: Weapon Image"
              },
              {
                "id": "sv-refined-ban-insulting-another-user",
                "title": "Ban: Insulting Another User"
              }
            ]
          },
          {
            "id": "sv-better-ban-restriction-management-promotion-impersonation",
            "title": "Promotion & Impersonation",
            "topics": [
              {
                "id": "sv-refined-ban-promoting-other-platforms",
                "title": "Ban: Promoting Other Platforms"
              },
              {
                "id": "sv-refined-ban-pretending-to-be-management",
                "title": "Ban: Pretending to Be Management"
              },
              {
                "id": "sv-refined-ban-pretending-to-be-a-coin-seller",
                "title": "Ban: Pretending to Be Coin Seller"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-recharge-coins-vip",
        "title": "Recharge, Coins & VIP",
        "sections": [
          {
            "id": "sv-better-recharge-coins-vip-recharge-guides",
            "title": "Recharge Guides",
            "topics": [
              {
                "id": "sv-refined-recharge-general-guide",
                "title": "Recharge General Guide"
              },
              {
                "id": "sv-refined-recharge-methods",
                "title": "Recharge Methods"
              },
              {
                "id": "sv-refined-recharge-steps",
                "title": "Recharge Steps"
              },
              {
                "id": "sv-refined-recharge-link",
                "title": "Recharge Link"
              },
              {
                "id": "sv-refined-recharge-through-visa",
                "title": "Recharge Through Visa"
              },
              {
                "id": "sv-refined-first-recharge-requirement",
                "title": "First Recharge Requirement"
              }
            ]
          },
          {
            "id": "sv-better-recharge-coins-vip-payment-problems-evidence",
            "title": "Payment Problems & Evidence",
            "topics": [
              {
                "id": "sv-refined-recharge-failed-alternatives",
                "title": "Recharge Failed / Alternatives"
              },
              {
                "id": "sv-refined-request-recharge-invoice",
                "title": "Request Recharge Invoice"
              },
              {
                "id": "sv-refined-coins-not-received",
                "title": "Coins Not Received"
              }
            ]
          },
          {
            "id": "sv-better-recharge-coins-vip-country-recharge-agencies",
            "title": "Country Recharge Agencies",
            "topics": [
              {
                "id": "sv-refined-recharge-through-agency-egypt",
                "title": "Recharge Agency - Egypt"
              },
              {
                "id": "sv-refined-recharge-through-agency-iraq",
                "title": "Recharge Agency - Iraq"
              },
              {
                "id": "sv-refined-recharge-through-agency-saudi-arabia",
                "title": "Recharge Agency - Saudi Arabia"
              },
              {
                "id": "sv-refined-recharge-through-agency-syria",
                "title": "Recharge Agency - Syria"
              },
              {
                "id": "sv-refined-recharge-through-agency-uae",
                "title": "Recharge Agency - UAE"
              }
            ]
          },
          {
            "id": "sv-better-recharge-coins-vip-vip-elite-club",
            "title": "VIP & Elite Club",
            "topics": [
              {
                "id": "sv-refined-elite-club-conditions",
                "title": "Elite Club Conditions"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-withdrawal-salary",
        "title": "Withdrawal & Salary",
        "sections": [
          {
            "id": "sv-better-withdrawal-salary-withdrawal-status-delays",
            "title": "Withdrawal Status & Delays",
            "topics": [
              {
                "id": "sv-refined-withdrawal-waiting-period",
                "title": "Withdrawal Waiting Period"
              },
              {
                "id": "sv-refined-withdrawal-successful-but-not-received",
                "title": "Successful but Not Received"
              },
              {
                "id": "sv-refined-request-withdrawal-screenshot",
                "title": "Request Withdrawal Screenshot"
              }
            ]
          },
          {
            "id": "sv-better-withdrawal-salary-withdrawal-methods-conditions",
            "title": "Withdrawal Methods & Conditions",
            "topics": [
              {
                "id": "sv-refined-fast-withdrawal-conditions",
                "title": "Fast Withdrawal Conditions"
              },
              {
                "id": "sv-refined-withdrawal-through-management",
                "title": "Withdrawal Through Management"
              }
            ]
          },
          {
            "id": "sv-better-withdrawal-salary-withdrawal-requests-options",
            "title": "Withdrawal Requests & Options",
            "topics": [
              {
                "id": "sv-refined-cancel-withdrawal-request",
                "title": "Cancel Withdrawal Request"
              },
              {
                "id": "sv-refined-add-remove-withdrawal-option",
                "title": "Add / Remove Withdrawal Option"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-agency-host-operations",
        "title": "Agency & Host Operations",
        "sections": [
          {
            "id": "sv-better-agency-host-operations-host-agency-creation",
            "title": "Host Agency Creation",
            "topics": [
              {
                "id": "sv-refined-create-host-agency",
                "title": "Create Host Agency"
              },
              {
                "id": "sv-refined-apply-to-open-host-agency",
                "title": "Apply to Open Host Agency"
              }
            ]
          },
          {
            "id": "sv-better-agency-host-operations-agency-transfer-sub-agency",
            "title": "Agency Transfer & Sub-Agency",
            "topics": [
              {
                "id": "sv-refined-change-agency-for-anchor",
                "title": "Change Agency for Anchor"
              },
              {
                "id": "sv-refined-agency-transfer-request",
                "title": "Agency Transfer Request"
              },
              {
                "id": "sv-refined-create-sub-agency",
                "title": "Create Sub-Agency"
              },
              {
                "id": "sv-refined-change-sub-agency-to-main-agency",
                "title": "Change Sub-Agency to Main Agency"
              }
            ]
          },
          {
            "id": "sv-better-agency-host-operations-agency-management-requirements",
            "title": "Agency Management Requirements",
            "topics": [
              {
                "id": "sv-refined-agency-admin-whatsapp-group-requirements",
                "title": "Admin WhatsApp Group Requirements"
              },
              {
                "id": "sv-refined-create-recharge-agency",
                "title": "Create Recharge Agency"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-games-matching-tasks",
        "title": "Games, Matching & Tasks",
        "sections": [
          {
            "id": "sv-better-games-matching-tasks-games-access-rules",
            "title": "Games Access Rules",
            "topics": [
              {
                "id": "sv-refined-games-access-conditions",
                "title": "Games Access Conditions"
              },
              {
                "id": "sv-refined-game-access-information",
                "title": "Game Access Information"
              },
              {
                "id": "sv-refined-game-access-information-alternative",
                "title": "Game Access Information - Alternative"
              }
            ]
          },
          {
            "id": "sv-better-games-matching-tasks-add-remove-games",
            "title": "Add / Remove Games",
            "topics": [
              {
                "id": "sv-refined-add-game-request",
                "title": "Add Game Request"
              },
              {
                "id": "sv-refined-add-games-request",
                "title": "Add Games Request"
              },
              {
                "id": "sv-refined-remove-game-request",
                "title": "Remove Game Request"
              },
              {
                "id": "sv-refined-remove-games-request",
                "title": "Remove Games Request"
              }
            ]
          },
          {
            "id": "sv-better-games-matching-tasks-matching-issues",
            "title": "Matching Issues",
            "topics": [
              {
                "id": "sv-refined-matching-issue-1",
                "title": "Matching Issue 1"
              },
              {
                "id": "sv-refined-matching-issue-2",
                "title": "Matching Issue 2"
              },
              {
                "id": "sv-refined-matching-issue-3",
                "title": "Matching Issue 3"
              }
            ]
          },
          {
            "id": "sv-better-games-matching-tasks-tasks",
            "title": "Tasks",
            "topics": [
              {
                "id": "sv-refined-daily-and-family-tasks",
                "title": "Daily and Family Tasks"
              }
            ]
          }
        ]
      },
      {
        "id": "sv-better-app-settings-country-location",
        "title": "App Settings, Country & Location",
        "sections": [
          {
            "id": "sv-better-app-settings-country-location-app-crash-technical-logs",
            "title": "App Crash & Technical Logs",
            "topics": [
              {
                "id": "sv-refined-app-crash-refresh-steps",
                "title": "App Crash / Refresh Steps"
              },
              {
                "id": "sv-refined-app-crash-upload-log",
                "title": "App Crash / Upload Log"
              }
            ]
          },
          {
            "id": "sv-better-app-settings-country-location-country-location-settings",
            "title": "Country & Location Settings",
            "topics": [
              {
                "id": "sv-refined-change-country",
                "title": "Change Country"
              },
              {
                "id": "sv-refined-change-country-follow-up",
                "title": "Change Country Follow-Up"
              },
              {
                "id": "sv-refined-close-location-hide-distance",
                "title": "Close Location / Hide Distance"
              },
              {
                "id": "sv-refined-location-disappeared",
                "title": "Location Disappeared"
              }
            ]
          }
        ]
      }
    ]
  }
];
  const topicsById = {
  "senior-cs-v51-command-center": {
    "id": "senior-cs-v51-command-center",
    "title": "Command Center",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "command-center-and-triage",
    "section": "Command Center & Triage",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Command Center & Triage",
      "Command Center"
    ]
  },
  "senior-cs-escalation-directory": {
    "id": "senior-cs-escalation-directory",
    "title": "Escalation Directory",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "command-center-and-triage",
    "section": "Command Center & Triage",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Command Center & Triage",
      "Escalation Directory"
    ]
  },
  "senior-cs-missing-info-checklists": {
    "id": "senior-cs-missing-info-checklists",
    "title": "Missing Info Checklists",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "command-center-and-triage",
    "section": "Command Center & Triage",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Command Center & Triage",
      "Missing Info Checklists"
    ]
  },
  "senior-cs-backend-links-reference": {
    "id": "senior-cs-backend-links-reference",
    "title": "Backend Links Reference",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "backend-systems-and-reference-links",
    "section": "Backend Systems & Reference Links",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Backend Systems & Reference Links",
      "Backend Links Reference"
    ]
  },
  "senior-cs-backend-system": {
    "id": "senior-cs-backend-system",
    "title": "Backend System",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "backend-systems-and-reference-links",
    "section": "Backend Systems & Reference Links",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Backend Systems & Reference Links",
      "Backend System"
    ]
  },
  "senior-cs-agency-activation": {
    "id": "senior-cs-agency-activation",
    "title": "Agency Activation",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "agency-operations-reference",
    "section": "Agency Operations Reference",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Agency Operations Reference",
      "Agency Activation"
    ]
  },
  "senior-cs-agency-management": {
    "id": "senior-cs-agency-management",
    "title": "Agency Management",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "agency-operations-reference",
    "section": "Agency Operations Reference",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Agency Operations Reference",
      "Agency Management"
    ]
  },
  "senior-cs-sub-agency": {
    "id": "senior-cs-sub-agency",
    "title": "Sub-Agency",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "agency-operations-reference",
    "section": "Agency Operations Reference",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Agency Operations Reference",
      "Sub-Agency"
    ]
  },
  "senior-cs-activities": {
    "id": "senior-cs-activities",
    "title": "Activities",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "agency-operations-reference",
    "section": "Agency Operations Reference",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Agency Operations Reference",
      "Activities"
    ]
  },
  "senior-cs-commission-targets": {
    "id": "senior-cs-commission-targets",
    "title": "Commission & Targets",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "commission-tasks-and-ratings",
    "section": "Commission, Tasks & Ratings",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Commission, Tasks & Ratings",
      "Commission & Targets"
    ]
  },
  "senior-cs-agency-tasks": {
    "id": "senior-cs-agency-tasks",
    "title": "Agency Tasks",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "commission-tasks-and-ratings",
    "section": "Commission, Tasks & Ratings",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Commission, Tasks & Ratings",
      "Agency Tasks"
    ]
  },
  "senior-cs-rating-groups": {
    "id": "senior-cs-rating-groups",
    "title": "Agency Rating & Groups",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "operations-command-and-references",
    "category": "Operations Command & References",
    "sectionId": "commission-tasks-and-ratings",
    "section": "Commission, Tasks & Ratings",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Operations Command & References",
      "Commission, Tasks & Ratings",
      "Agency Rating & Groups"
    ]
  },
  "account-support-optimized": {
    "id": "account-support-optimized",
    "title": "Account Support Optimized",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "optimized-account-overview",
    "section": "Optimized Account Overview",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Optimized Account Overview",
      "Account Support Optimized"
    ]
  },
  "account-register-signup": {
    "id": "account-register-signup",
    "title": "Account Sign-Up Guide",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "registration-and-account-limits",
    "section": "Registration & Account Limits",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Registration & Account Limits",
      "Account Sign-Up Guide"
    ]
  },
  "account-register-limits": {
    "id": "account-register-limits",
    "title": "Account Registration Limits",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "registration-and-account-limits",
    "section": "Registration & Account Limits",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Registration & Account Limits",
      "Account Registration Limits"
    ]
  },
  "account-login-login": {
    "id": "account-login-login",
    "title": "Account Login",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "login-password-and-device-access",
    "section": "Login, Password & Device Access",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Login, Password & Device Access",
      "Account Login"
    ]
  },
  "account-login-issues": {
    "id": "account-login-issues",
    "title": "Login Issues and Troubleshooting",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "login-password-and-device-access",
    "section": "Login, Password & Device Access",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Login, Password & Device Access",
      "Login Issues and Troubleshooting"
    ]
  },
  "account-login-recovery": {
    "id": "account-login-recovery",
    "title": "Password Recovery",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "login-password-and-device-access",
    "section": "Login, Password & Device Access",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Login, Password & Device Access",
      "Password Recovery"
    ]
  },
  "account-login-phone": {
    "id": "account-login-phone",
    "title": "Linked Phone Number No Longer in Use",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "login-password-and-device-access",
    "section": "Login, Password & Device Access",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Login, Password & Device Access",
      "Linked Phone Number No Longer in Use"
    ]
  },
  "account-login-multidevice": {
    "id": "account-login-multidevice",
    "title": "Multi-Device Access",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "login-password-and-device-access",
    "section": "Login, Password & Device Access",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Login, Password & Device Access",
      "Multi-Device Access"
    ]
  },
  "account-login-methods": {
    "id": "account-login-methods",
    "title": "Available Login Methods",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "login-password-and-device-access",
    "section": "Login, Password & Device Access",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Login, Password & Device Access",
      "Available Login Methods"
    ]
  },
  "account-security-sms": {
    "id": "account-security-sms",
    "title": "SMS Verification Not Received",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "security-sms-and-phone-binding",
    "section": "Security, SMS & Phone Binding",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Security, SMS & Phone Binding",
      "SMS Verification Not Received"
    ]
  },
  "account-security-reset": {
    "id": "account-security-reset",
    "title": "Password Reset Guide",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "security-sms-and-phone-binding",
    "section": "Security, SMS & Phone Binding",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Security, SMS & Phone Binding",
      "Password Reset Guide"
    ]
  },
  "account-security-link": {
    "id": "account-security-link",
    "title": "Link Phone Number",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "security-sms-and-phone-binding",
    "section": "Security, SMS & Phone Binding",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Security, SMS & Phone Binding",
      "Link Phone Number"
    ]
  },
  "account-security-recovery": {
    "id": "account-security-recovery",
    "title": "Account Security and Recovery",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "security-sms-and-phone-binding",
    "section": "Security, SMS & Phone Binding",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Security, SMS & Phone Binding",
      "Account Security and Recovery"
    ]
  },
  "account-security-stolen": {
    "id": "account-security-stolen",
    "title": "Stolen / Compromised Account",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "security-sms-and-phone-binding",
    "section": "Security, SMS & Phone Binding",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Security, SMS & Phone Binding",
      "Stolen / Compromised Account"
    ]
  },
  "account-profile-picture": {
    "id": "account-profile-picture",
    "title": "Profile Picture Management",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "profile-location-and-privacy",
    "section": "Profile, Location & Privacy",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Profile, Location & Privacy",
      "Profile Picture Management"
    ]
  },
  "account-profile-nickname": {
    "id": "account-profile-nickname",
    "title": "Nickname Management",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "profile-location-and-privacy",
    "section": "Profile, Location & Privacy",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Profile, Location & Privacy",
      "Nickname Management"
    ]
  },
  "account-profile-gender": {
    "id": "account-profile-gender",
    "title": "Account Gender Change",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "profile-location-and-privacy",
    "section": "Profile, Location & Privacy",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Profile, Location & Privacy",
      "Account Gender Change"
    ]
  },
  "account-profile-location": {
    "id": "account-profile-location",
    "title": "Account Location and Country Settings",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "profile-location-and-privacy",
    "section": "Profile, Location & Privacy",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Profile, Location & Privacy",
      "Account Location and Country Settings"
    ]
  },
  "account-profile-distance": {
    "id": "account-profile-distance",
    "title": "Distance Visibility Settings",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "profile-location-and-privacy",
    "section": "Profile, Location & Privacy",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Profile, Location & Privacy",
      "Distance Visibility Settings"
    ]
  },
  "account-ban-reasons": {
    "id": "account-ban-reasons",
    "title": "Account Ban Reasons",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "ban-appeal-and-account-deletion",
    "section": "Ban, Appeal & Account Deletion",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Ban, Appeal & Account Deletion",
      "Account Ban Reasons"
    ]
  },
  "account-ban-unban": {
    "id": "account-ban-unban",
    "title": "Account Unban and Appeal Process",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "ban-appeal-and-account-deletion",
    "section": "Ban, Appeal & Account Deletion",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Ban, Appeal & Account Deletion",
      "Account Unban and Appeal Process"
    ]
  },
  "account-ban-self-request": {
    "id": "account-ban-self-request",
    "title": "Account Self-Ban Request",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "ban-appeal-and-account-deletion",
    "section": "Ban, Appeal & Account Deletion",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Ban, Appeal & Account Deletion",
      "Account Self-Ban Request"
    ]
  },
  "account-ban-deletion": {
    "id": "account-ban-deletion",
    "title": "Account Deletion Guide",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "account-access-and-identity",
    "category": "Account, Access & Identity",
    "sectionId": "ban-appeal-and-account-deletion",
    "section": "Ban, Appeal & Account Deletion",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Account, Access & Identity",
      "Ban, Appeal & Account Deletion",
      "Account Deletion Guide"
    ]
  },
  "payment-support-optimized": {
    "id": "payment-support-optimized",
    "title": "Payment Support Optimized",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "optimized-payment-overview",
    "section": "Optimized Payment Overview",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Optimized Payment Overview",
      "Payment Support Optimized"
    ]
  },
  "payment-recharge-process": {
    "id": "payment-recharge-process",
    "title": "Recharge Process",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Recharge Process"
    ]
  },
  "payment-recharge-coin-sellers": {
    "id": "payment-recharge-coin-sellers",
    "title": "Recharge via Coin Sellers",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Recharge via Coin Sellers"
    ]
  },
  "payment-recharge-link-availability": {
    "id": "payment-recharge-link-availability",
    "title": "Recharge Link Availability",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Recharge Link Availability"
    ]
  },
  "payment-recharge-remove-payment": {
    "id": "payment-recharge-remove-payment",
    "title": "Removing Saved Payment Details",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Removing Saved Payment Details"
    ]
  },
  "recharge-failure-menu": {
    "id": "recharge-failure-menu",
    "title": "Recharge Failure Issues",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Recharge Failure Issues"
    ]
  },
  "payment-recharge-missing-coins": {
    "id": "payment-recharge-missing-coins",
    "title": "Missing Coins After Recharge",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Missing Coins After Recharge"
    ]
  },
  "payment-recharge-coin-history": {
    "id": "payment-recharge-coin-history",
    "title": "Coin History Check",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Coin History Check"
    ]
  },
  "payment-recharge-currency-adjustment": {
    "id": "payment-recharge-currency-adjustment",
    "title": "Impact of Currency Adjustment on Account Balances and Levels",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Impact of Currency Adjustment on Account Balances and Levels"
    ]
  },
  "payment-recharge-dobi-balance": {
    "id": "payment-recharge-dobi-balance",
    "title": "Checking Dobi Coin Balance",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "recharge-flow-channels-and-missing-coins",
    "section": "Recharge Flow, Channels & Missing Coins",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Recharge Flow, Channels & Missing Coins",
      "Checking Dobi Coin Balance"
    ]
  },
  "payment-diamonds-acquisition": {
    "id": "payment-diamonds-acquisition",
    "title": "Diamonds Acquisition",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Diamonds Acquisition"
    ]
  },
  "payment-diamonds-exchanging": {
    "id": "payment-diamonds-exchanging",
    "title": "Exchanging Diamonds for Coins",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Exchanging Diamonds for Coins"
    ]
  },
  "payment-diamonds-missing-exchange": {
    "id": "payment-diamonds-missing-exchange",
    "title": "Missing Diamond Exchange Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Missing Diamond Exchange Option"
    ]
  },
  "payment-diamonds-withdrawal": {
    "id": "payment-diamonds-withdrawal",
    "title": "Diamond Withdrawal Process",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Diamond Withdrawal Process"
    ]
  },
  "payment-diamonds-withdraw-button": {
    "id": "payment-diamonds-withdraw-button",
    "title": "Withdraw Button Not Visible",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Withdraw Button Not Visible"
    ]
  },
  "payment-diamonds-missing-quick": {
    "id": "payment-diamonds-missing-quick",
    "title": "Missing Quick Withdrawal Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Missing Quick Withdrawal Option"
    ]
  },
  "payment-diamonds-remove-options": {
    "id": "payment-diamonds-remove-options",
    "title": "Removing Withdrawal or Exchange Options",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "diamonds-exchange-and-withdrawal-options",
    "section": "Diamonds, Exchange & Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Diamonds, Exchange & Withdrawal Options",
      "Removing Withdrawal or Exchange Options"
    ]
  },
  "payment-vip-overview": {
    "id": "payment-vip-overview",
    "title": "VIP Overview",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "vip-privileges-and-cards",
    "section": "VIP Privileges & Cards",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "VIP Privileges & Cards",
      "VIP Overview"
    ]
  },
  "payment-vip-experience-card": {
    "id": "payment-vip-experience-card",
    "title": "Using VIP Experience Card",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "vip-privileges-and-cards",
    "section": "VIP Privileges & Cards",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "VIP Privileges & Cards",
      "Using VIP Experience Card"
    ]
  },
  "payment-vip-card-effect-svip": {
    "id": "payment-vip-card-effect-svip",
    "title": "VIP Experience Card Effect on SVIP",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "vip-privileges-and-cards",
    "section": "VIP Privileges & Cards",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "VIP Privileges & Cards",
      "VIP Experience Card Effect on SVIP"
    ]
  },
  "payment-vip-unexpected-deduction": {
    "id": "payment-vip-unexpected-deduction",
    "title": "Unexpected VIP Points Deduction",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "vip-privileges-and-cards",
    "section": "VIP Privileges & Cards",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "VIP Privileges & Cards",
      "Unexpected VIP Points Deduction"
    ]
  },
  "payment-svip-privileges": {
    "id": "payment-svip-privileges",
    "title": "SVIP Privileges",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "SVIP Privileges"
    ]
  },
  "payment-svip-becoming": {
    "id": "payment-svip-becoming",
    "title": "Becoming an SVIP",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Becoming an SVIP"
    ]
  },
  "payment-svip-degradation": {
    "id": "payment-svip-degradation",
    "title": "SVIP Level Degradation",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "SVIP Level Degradation"
    ]
  },
  "payment-svip-points": {
    "id": "payment-svip-points",
    "title": "Acquiring and Using SVIP Points",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Acquiring and Using SVIP Points"
    ]
  },
  "payment-svip-level-requirements": {
    "id": "payment-svip-level-requirements",
    "title": "SVIP Level Requirements",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "SVIP Level Requirements"
    ]
  },
  "payment-svip-unexpected-deduction": {
    "id": "payment-svip-unexpected-deduction",
    "title": "Unexpected SVIP Points Deduction",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Unexpected SVIP Points Deduction"
    ]
  },
  "payment-svip-dynamic-nickname": {
    "id": "payment-svip-dynamic-nickname",
    "title": "Obtaining Dynamic Nickname",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Obtaining Dynamic Nickname"
    ]
  },
  "payment-svip-unique-id": {
    "id": "payment-svip-unique-id",
    "title": "Acquiring Unique ID",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Acquiring Unique ID"
    ]
  },
  "payment-svip-elite-club": {
    "id": "payment-svip-elite-club",
    "title": "Joining the Elite Club",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Joining the Elite Club"
    ]
  },
  "payment-svip-offline-recharge": {
    "id": "payment-svip-offline-recharge",
    "title": "Offline Recharge and VIP/SVIP/Elite Status",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "svip-levels-points-and-elite-club",
    "section": "SVIP Levels, Points & Elite Club",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "SVIP Levels, Points & Elite Club",
      "Offline Recharge and VIP/SVIP/Elite Status"
    ]
  },
  "payment-aristocracy-overview": {
    "id": "payment-aristocracy-overview",
    "title": "Aristocracy Overview and Acquisition",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "aristocracy-invisibility-and-incognito",
    "section": "Aristocracy, Invisibility & Incognito",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Aristocracy, Invisibility & Incognito",
      "Aristocracy Overview and Acquisition"
    ]
  },
  "payment-aristocracy-invisibility": {
    "id": "payment-aristocracy-invisibility",
    "title": "Obtaining Invisibility and Incognito",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "aristocracy-invisibility-and-incognito",
    "section": "Aristocracy, Invisibility & Incognito",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Aristocracy, Invisibility & Incognito",
      "Obtaining Invisibility and Incognito"
    ]
  },
  "payment-decoration-acquiring": {
    "id": "payment-decoration-acquiring",
    "title": "Acquiring Frames, Fantasy Cars or Entrance Vehicles",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "decoration-frames-and-entry-effects",
    "section": "Decoration, Frames & Entry Effects",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Decoration, Frames & Entry Effects",
      "Acquiring Frames, Fantasy Cars or Entrance Vehicles"
    ]
  },
  "payment-decoration-equipping": {
    "id": "payment-decoration-equipping",
    "title": "Equipping or Changing Frames and Vehicles",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "decoration-frames-and-entry-effects",
    "section": "Decoration, Frames & Entry Effects",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Decoration, Frames & Entry Effects",
      "Equipping or Changing Frames and Vehicles"
    ]
  },
  "payment-decoration-entry-effect": {
    "id": "payment-decoration-entry-effect",
    "title": "Entry Effect Not Visible After Equipping",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "recharge-payment-and-privileges",
    "category": "Recharge, Payment & Privileges",
    "sectionId": "decoration-frames-and-entry-effects",
    "section": "Decoration, Frames & Entry Effects",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Recharge, Payment & Privileges",
      "Decoration, Frames & Entry Effects",
      "Entry Effect Not Visible After Equipping"
    ]
  },
  "function-support-optimized": {
    "id": "function-support-optimized",
    "title": "Function Support Optimized",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "optimized-function-overview",
    "section": "Optimized Function Overview",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Optimized Function Overview",
      "Function Support Optimized"
    ]
  },
  "function-social-searching-friends": {
    "id": "function-social-searching-friends",
    "title": "Searching for Real-Life Friends",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "user-search-ids-and-discovery",
    "section": "User Search, IDs & Discovery",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "User Search, IDs & Discovery",
      "Searching for Real-Life Friends"
    ]
  },
  "function-social-user-not-found": {
    "id": "function-social-user-not-found",
    "title": "User Not Found by ID",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "user-search-ids-and-discovery",
    "section": "User Search, IDs & Discovery",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "User Search, IDs & Discovery",
      "User Not Found by ID"
    ]
  },
  "function-social-finding-account-id": {
    "id": "function-social-finding-account-id",
    "title": "Finding Account ID",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "user-search-ids-and-discovery",
    "section": "User Search, IDs & Discovery",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "User Search, IDs & Discovery",
      "Finding Account ID"
    ]
  },
  "function-social-coins-deducted-messages": {
    "id": "function-social-coins-deducted-messages",
    "title": "Coins Deducted for Messages",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Coins Deducted for Messages"
    ]
  },
  "function-social-varying-coin-costs": {
    "id": "function-social-varying-coin-costs",
    "title": "Varying Coin Costs for Chat Messages",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Varying Coin Costs for Chat Messages"
    ]
  },
  "function-social-chatting-free": {
    "id": "function-social-chatting-free",
    "title": "Chatting for Free",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Chatting for Free"
    ]
  },
  "function-social-unable-send-messages": {
    "id": "function-social-unable-send-messages",
    "title": "Unable to Send Messages",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Unable to Send Messages"
    ]
  },
  "function-social-chat-background": {
    "id": "function-social-chat-background",
    "title": "Chat Background Settings",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Chat Background Settings"
    ]
  },
  "function-social-delete-chat-history": {
    "id": "function-social-delete-chat-history",
    "title": "Deleting Chat History",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Deleting Chat History"
    ]
  },
  "function-social-translation-not-available": {
    "id": "function-social-translation-not-available",
    "title": "Message Translation Not Available",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "messaging-chat-costs-and-chat-tools",
    "section": "Messaging, Chat Costs & Chat Tools",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Messaging, Chat Costs & Chat Tools",
      "Message Translation Not Available"
    ]
  },
  "function-social-following-users": {
    "id": "function-social-following-users",
    "title": "Following Other Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "following-blocking-and-reporting",
    "section": "Following, Blocking & Reporting",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Following, Blocking & Reporting",
      "Following Other Users"
    ]
  },
  "function-social-cannot-follow-more": {
    "id": "function-social-cannot-follow-more",
    "title": "Cannot Follow More Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "following-blocking-and-reporting",
    "section": "Following, Blocking & Reporting",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Following, Blocking & Reporting",
      "Cannot Follow More Users"
    ]
  },
  "function-social-unfollowing-users": {
    "id": "function-social-unfollowing-users",
    "title": "Unfollowing Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "following-blocking-and-reporting",
    "section": "Following, Blocking & Reporting",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Following, Blocking & Reporting",
      "Unfollowing Users"
    ]
  },
  "function-social-blocking-users": {
    "id": "function-social-blocking-users",
    "title": "Blocking Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "following-blocking-and-reporting",
    "section": "Following, Blocking & Reporting",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Following, Blocking & Reporting",
      "Blocking Users"
    ]
  },
  "function-social-blacklist-unblock": {
    "id": "function-social-blacklist-unblock",
    "title": "Accessing Blacklist and Unblocking",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "following-blocking-and-reporting",
    "section": "Following, Blocking & Reporting",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Following, Blocking & Reporting",
      "Accessing Blacklist and Unblocking"
    ]
  },
  "function-social-reporting": {
    "id": "function-social-reporting",
    "title": "Reporting Behavior or Content",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "following-blocking-and-reporting",
    "section": "Following, Blocking & Reporting",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Following, Blocking & Reporting",
      "Reporting Behavior or Content"
    ]
  },
  "function-social-chat-points-overview": {
    "id": "function-social-chat-points-overview",
    "title": "Chat Points Overview and Mechanics",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "chat-points-diamonds-and-gifts",
    "section": "Chat Points, Diamonds & Gifts",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Chat Points, Diamonds & Gifts",
      "Chat Points Overview and Mechanics"
    ]
  },
  "function-social-chat-points-importance": {
    "id": "function-social-chat-points-importance",
    "title": "Importance of Chat Points",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "chat-points-diamonds-and-gifts",
    "section": "Chat Points, Diamonds & Gifts",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Chat Points, Diamonds & Gifts",
      "Importance of Chat Points"
    ]
  },
  "function-social-chat-points-decrease": {
    "id": "function-social-chat-points-decrease",
    "title": "Chat Points Decrease Despite Chat Star Status",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "chat-points-diamonds-and-gifts",
    "section": "Chat Points, Diamonds & Gifts",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Chat Points, Diamonds & Gifts",
      "Chat Points Decrease Despite Chat Star Status"
    ]
  },
  "function-social-no-diamonds-replying": {
    "id": "function-social-no-diamonds-replying",
    "title": "No Diamonds for Replying to Male Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "chat-points-diamonds-and-gifts",
    "section": "Chat Points, Diamonds & Gifts",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Chat Points, Diamonds & Gifts",
      "No Diamonds for Replying to Male Users"
    ]
  },
  "function-social-transfer-gifts": {
    "id": "function-social-transfer-gifts",
    "title": "Transferring Gifts to User Backpack",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "chat-points-diamonds-and-gifts",
    "section": "Chat Points, Diamonds & Gifts",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Chat Points, Diamonds & Gifts",
      "Transferring Gifts to User Backpack"
    ]
  },
  "function-moments-posting-failure": {
    "id": "function-moments-posting-failure",
    "title": "Moment Posting Failure",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "moments-and-comments",
    "section": "Moments & Comments",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Moments & Comments",
      "Moment Posting Failure"
    ]
  },
  "function-moments-unable-comment": {
    "id": "function-moments-unable-comment",
    "title": "Unable to Comment on Moments",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "moments-and-comments",
    "section": "Moments & Comments",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Moments & Comments",
      "Unable to Comment on Moments"
    ]
  },
  "function-moments-profile-shows-zero": {
    "id": "function-moments-profile-shows-zero",
    "title": "Profile Shows 0 Moments Despite Posts",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "moments-and-comments",
    "section": "Moments & Comments",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Moments & Comments",
      "Profile Shows 0 Moments Despite Posts"
    ]
  },
  "function-relationships-missing-call-voice": {
    "id": "function-relationships-missing-call-voice",
    "title": "Missing Call and Voice Message Options",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Missing Call and Voice Message Options"
    ]
  },
  "function-relationships-creating": {
    "id": "function-relationships-creating",
    "title": "Creating Relationships with Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Creating Relationships with Users"
    ]
  },
  "function-relationships-not-showing": {
    "id": "function-relationships-not-showing",
    "title": "Relationship Not Showing on Mini Card",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Relationship Not Showing on Mini Card"
    ]
  },
  "function-relationships-ending": {
    "id": "function-relationships-ending",
    "title": "Ending a Relationship",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Ending a Relationship"
    ]
  },
  "function-relationships-guarding-others": {
    "id": "function-relationships-guarding-others",
    "title": "Guarding Other Users",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Guarding Other Users"
    ]
  },
  "function-relationships-guardian-points": {
    "id": "function-relationships-guardian-points",
    "title": "Guardian Points Explanation and Management",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Guardian Points Explanation and Management"
    ]
  },
  "function-relationships-hiding-guardianship": {
    "id": "function-relationships-hiding-guardianship",
    "title": "Hiding Guardianship",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Hiding Guardianship"
    ]
  },
  "function-relationships-ending-guardianship": {
    "id": "function-relationships-ending-guardianship",
    "title": "Ending Guardianship",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "relationships-and-guardianship",
    "section": "Relationships & Guardianship",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Relationships & Guardianship",
      "Ending Guardianship"
    ]
  },
  "function-family-actions-after-joining": {
    "id": "function-family-actions-after-joining",
    "title": "Actions After Joining a Family",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "family-features-and-tasks",
    "section": "Family Features & Tasks",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Family Features & Tasks",
      "Actions After Joining a Family"
    ]
  },
  "function-family-joining": {
    "id": "function-family-joining",
    "title": "Joining a Family",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "family-features-and-tasks",
    "section": "Family Features & Tasks",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Family Features & Tasks",
      "Joining a Family"
    ]
  },
  "function-family-leaving": {
    "id": "function-family-leaving",
    "title": "Leaving a Family",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "family-features-and-tasks",
    "section": "Family Features & Tasks",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Family Features & Tasks",
      "Leaving a Family"
    ]
  },
  "function-family-hiding-info": {
    "id": "function-family-hiding-info",
    "title": "Hiding Family Information",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "family-features-and-tasks",
    "section": "Family Features & Tasks",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Family Features & Tasks",
      "Hiding Family Information"
    ]
  },
  "function-family-creating": {
    "id": "function-family-creating",
    "title": "Creating a Family",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "family-features-and-tasks",
    "section": "Family Features & Tasks",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Family Features & Tasks",
      "Creating a Family"
    ]
  },
  "function-family-missing-tasks": {
    "id": "function-family-missing-tasks",
    "title": "Missing Family or Daily Tasks",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "social-moments-and-community",
    "category": "Social, Moments & Community",
    "sectionId": "family-features-and-tasks",
    "section": "Family Features & Tasks",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Social, Moments & Community",
      "Family Features & Tasks",
      "Missing Family or Daily Tasks"
    ]
  },
  "function-room-creating-personal": {
    "id": "function-room-creating-personal",
    "title": "Creating Personal Room",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Creating Personal Room"
    ]
  },
  "function-room-live-requirements": {
    "id": "function-room-live-requirements",
    "title": "Live/Video Room Opening Requirements",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Live/Video Room Opening Requirements"
    ]
  },
  "function-room-incorrect-password": {
    "id": "function-room-incorrect-password",
    "title": "Incorrect Room Password Error Resolution",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Incorrect Room Password Error Resolution"
    ]
  },
  "function-room-settings-adjustment": {
    "id": "function-room-settings-adjustment",
    "title": "Room Settings Adjustment",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Room Settings Adjustment"
    ]
  },
  "function-room-gif-cover": {
    "id": "function-room-gif-cover",
    "title": "Setting GIF as Room Cover",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Setting GIF as Room Cover"
    ]
  },
  "function-room-adjust-mode": {
    "id": "function-room-adjust-mode",
    "title": "Adjusting Room Mode",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Adjusting Room Mode"
    ]
  },
  "function-room-obtaining-tags": {
    "id": "function-room-obtaining-tags",
    "title": "Obtaining Room Tags (Bronze/Silver/Gold)",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-creation-settings-and-room-tags",
    "section": "Room Creation, Settings & Room Tags",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Creation, Settings & Room Tags",
      "Obtaining Room Tags (Bronze/Silver/Gold)"
    ]
  },
  "function-room-gift-effects-not-visible": {
    "id": "function-room-gift-effects-not-visible",
    "title": "Gift Effects Not Visible",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-live-sound-and-gift-issues",
    "section": "Room Live, Sound & Gift Issues",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Live, Sound & Gift Issues",
      "Gift Effects Not Visible"
    ]
  },
  "function-room-unable-follow-live": {
    "id": "function-room-unable-follow-live",
    "title": "Unable to Follow Live Room",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-live-sound-and-gift-issues",
    "section": "Room Live, Sound & Gift Issues",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Live, Sound & Gift Issues",
      "Unable to Follow Live Room"
    ]
  },
  "function-room-mic-on-not-heard": {
    "id": "function-room-mic-on-not-heard",
    "title": "Microphone On But Not Heard",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-live-sound-and-gift-issues",
    "section": "Room Live, Sound & Gift Issues",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Live, Sound & Gift Issues",
      "Microphone On But Not Heard"
    ]
  },
  "function-room-no-sound": {
    "id": "function-room-no-sound",
    "title": "No Sound in Rooms",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-live-sound-and-gift-issues",
    "section": "Room Live, Sound & Gift Issues",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Live, Sound & Gift Issues",
      "No Sound in Rooms"
    ]
  },
  "function-host-single-video-mode": {
    "id": "function-host-single-video-mode",
    "title": "Enabling Single Video Mode Live",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "room-live-sound-and-gift-issues",
    "section": "Room Live, Sound & Gift Issues",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Room Live, Sound & Gift Issues",
      "Enabling Single Video Mode Live"
    ]
  },
  "function-host-quick-greetings": {
    "id": "function-host-quick-greetings",
    "title": "Setting Quick Greetings for Matching",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-greetings-and-message-pricing",
    "section": "Host Greetings & Message Pricing",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Greetings & Message Pricing",
      "Setting Quick Greetings for Matching"
    ]
  },
  "function-host-greeting-issues": {
    "id": "function-host-greeting-issues",
    "title": "Issues with Sending Greeting Messages",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-greetings-and-message-pricing",
    "section": "Host Greetings & Message Pricing",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Greetings & Message Pricing",
      "Issues with Sending Greeting Messages"
    ]
  },
  "function-host-message-price": {
    "id": "function-host-message-price",
    "title": "Setting Message Price",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-greetings-and-message-pricing",
    "section": "Host Greetings & Message Pricing",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Greetings & Message Pricing",
      "Setting Message Price"
    ]
  },
  "function-host-gender-verification-failure": {
    "id": "function-host-gender-verification-failure",
    "title": "Gender/Profile Verification Failure",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-verification-and-anchor-review",
    "section": "Host Verification & Anchor Review",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Verification & Anchor Review",
      "Gender/Profile Verification Failure"
    ]
  },
  "function-host-repeated-verification": {
    "id": "function-host-repeated-verification",
    "title": "Repeated Verification Requests",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-verification-and-anchor-review",
    "section": "Host Verification & Anchor Review",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Verification & Anchor Review",
      "Repeated Verification Requests"
    ]
  },
  "function-host-anchor-application-rejected": {
    "id": "function-host-anchor-application-rejected",
    "title": "Anchor Application Rejected",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-verification-and-anchor-review",
    "section": "Host Verification & Anchor Review",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Verification & Anchor Review",
      "Anchor Application Rejected"
    ]
  },
  "function-host-becoming-host-agency": {
    "id": "function-host-becoming-host-agency",
    "title": "Becoming a Host or Joining Agency",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "agency-entry-creation-and-transfer",
    "section": "Agency Entry, Creation & Transfer",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Agency Entry, Creation & Transfer",
      "Becoming a Host or Joining Agency"
    ]
  },
  "function-host-agency-conditions-error": {
    "id": "function-host-agency-conditions-error",
    "title": "Agency Join Conditions Not Met Error",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "agency-entry-creation-and-transfer",
    "section": "Agency Entry, Creation & Transfer",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Agency Entry, Creation & Transfer",
      "Agency Join Conditions Not Met Error"
    ]
  },
  "function-host-creating-agency": {
    "id": "function-host-creating-agency",
    "title": "Creating Personal Agency",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "agency-entry-creation-and-transfer",
    "section": "Agency Entry, Creation & Transfer",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Agency Entry, Creation & Transfer",
      "Creating Personal Agency"
    ]
  },
  "function-host-transfer-new-agency": {
    "id": "function-host-transfer-new-agency",
    "title": "Transferring to New Agency",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "agency-entry-creation-and-transfer",
    "section": "Agency Entry, Creation & Transfer",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Agency Entry, Creation & Transfer",
      "Transferring to New Agency"
    ]
  },
  "function-host-blocked-multiple-accounts": {
    "id": "function-host-blocked-multiple-accounts",
    "title": "Agency Join Blocked Due to Multiple Accounts",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "agency-entry-creation-and-transfer",
    "section": "Agency Entry, Creation & Transfer",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Agency Entry, Creation & Transfer",
      "Agency Join Blocked Due to Multiple Accounts"
    ]
  },
  "function-host-withdrawal-success-no-payment": {
    "id": "function-host-withdrawal-success-no-payment",
    "title": "Successful Withdrawal But No Payment Received",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-withdrawal-options",
    "section": "Host Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Withdrawal Options",
      "Successful Withdrawal But No Payment Received"
    ]
  },
  "function-host-missing-withdrawal-option": {
    "id": "function-host-missing-withdrawal-option",
    "title": "Missing Withdrawal Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-withdrawal-options",
    "section": "Host Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Withdrawal Options",
      "Missing Withdrawal Option"
    ]
  },
  "function-host-missing-quick-withdrawal": {
    "id": "function-host-missing-quick-withdrawal",
    "title": "Missing Quick Withdrawal Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "rooms-hosts-and-agency-operations",
    "category": "Rooms, Hosts & Agency Operations",
    "sectionId": "host-withdrawal-options",
    "section": "Host Withdrawal Options",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Rooms, Hosts & Agency Operations",
      "Host Withdrawal Options",
      "Missing Quick Withdrawal Option"
    ]
  },
  "function-tasks-getting-free-coins": {
    "id": "function-tasks-getting-free-coins",
    "title": "Getting Free Coins",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "tasks-and-reward-tracking",
    "section": "Tasks & Reward Tracking",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Tasks & Reward Tracking",
      "Getting Free Coins"
    ]
  },
  "function-tasks-daily-no-rewards": {
    "id": "function-tasks-daily-no-rewards",
    "title": "Daily Tasks Completed But No Rewards",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "tasks-and-reward-tracking",
    "section": "Tasks & Reward Tracking",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Tasks & Reward Tracking",
      "Daily Tasks Completed But No Rewards"
    ]
  },
  "function-tasks-monthly-diamond-target": {
    "id": "function-tasks-monthly-diamond-target",
    "title": "Monthly Diamond Target Not Rewarded",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "tasks-and-reward-tracking",
    "section": "Tasks & Reward Tracking",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Tasks & Reward Tracking",
      "Monthly Diamond Target Not Rewarded"
    ]
  },
  "function-tasks-room-details": {
    "id": "function-tasks-room-details",
    "title": "Room Tasks Details",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "tasks-and-reward-tracking",
    "section": "Tasks & Reward Tracking",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Tasks & Reward Tracking",
      "Room Tasks Details"
    ]
  },
  "function-tasks-weekly-room-availability": {
    "id": "function-tasks-weekly-room-availability",
    "title": "Weekly Room Task Availability",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "tasks-and-reward-tracking",
    "section": "Tasks & Reward Tracking",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Tasks & Reward Tracking",
      "Weekly Room Task Availability"
    ]
  },
  "function-games-no-reward": {
    "id": "function-games-no-reward",
    "title": "Event Participation Without Reward",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "Event Participation Without Reward"
    ]
  },
  "function-games-crashing": {
    "id": "function-games-crashing",
    "title": "App/Room/Game Crashing or Feature Issues",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "App/Room/Game Crashing or Feature Issues"
    ]
  },
  "function-games-car-tycoon": {
    "id": "function-games-car-tycoon",
    "title": "Playing Car Tycoon Game",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "Playing Car Tycoon Game"
    ]
  },
  "function-games-win-no-reward": {
    "id": "function-games-win-no-reward",
    "title": "Game Win Without Reward",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "Game Win Without Reward"
    ]
  },
  "function-games-manipulation-concerns": {
    "id": "function-games-manipulation-concerns",
    "title": "Game Results Manipulation Concerns",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "Game Results Manipulation Concerns"
    ]
  },
  "function-games-compensation-policy": {
    "id": "function-games-compensation-policy",
    "title": "Game Compensation Policy",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "Game Compensation Policy"
    ]
  },
  "function-games-whitelist-blacklist-request": {
    "id": "function-games-whitelist-blacklist-request",
    "title": "Game Whitelist / Blacklist Request",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "games-events-and-compensation",
    "section": "Games, Events & Compensation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Games, Events & Compensation",
      "Game Whitelist / Blacklist Request"
    ]
  },
  "function-cot-overview": {
    "id": "function-cot-overview",
    "title": "Clash of Thrones Game Overview",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Clash of Thrones Game Overview"
    ]
  },
  "function-cot-improving-combat-power": {
    "id": "function-cot-improving-combat-power",
    "title": "Improving Combat Power",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Improving Combat Power"
    ]
  },
  "function-cot-treasure-keys": {
    "id": "function-cot-treasure-keys",
    "title": "Obtaining Treasure Chest Keys",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Obtaining Treasure Chest Keys"
    ]
  },
  "function-cot-ladder-ranking": {
    "id": "function-cot-ladder-ranking",
    "title": "Ladder Ranking System",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Ladder Ranking System"
    ]
  },
  "function-cot-upgrading-castle": {
    "id": "function-cot-upgrading-castle",
    "title": "Upgrading Castle",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Upgrading Castle"
    ]
  },
  "function-cot-automatic-chest": {
    "id": "function-cot-automatic-chest",
    "title": "Automatic Treasure Chest Opening",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Automatic Treasure Chest Opening"
    ]
  },
  "function-cot-starlight": {
    "id": "function-cot-starlight",
    "title": "Starlight Usage and Acquisition",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-basics-and-progression",
    "section": "Clash of Thrones — Basics & Progression",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Basics & Progression",
      "Starlight Usage and Acquisition"
    ]
  },
  "function-cot-alliances-overview": {
    "id": "function-cot-alliances-overview",
    "title": "Alliances Overview and Joining/Creating",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Alliances Overview and Joining/Creating"
    ]
  },
  "function-cot-unable-join-alliance": {
    "id": "function-cot-unable-join-alliance",
    "title": "Unable to Join Alliance",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Unable to Join Alliance"
    ]
  },
  "function-cot-joining-alliance-group": {
    "id": "function-cot-joining-alliance-group",
    "title": "Joining Alliance Group",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Joining Alliance Group"
    ]
  },
  "function-cot-leaving-alliance": {
    "id": "function-cot-leaving-alliance",
    "title": "Leaving Alliance",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Leaving Alliance"
    ]
  },
  "function-cot-guardian-beast": {
    "id": "function-cot-guardian-beast",
    "title": "Guardian Beast Explanation",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Guardian Beast Explanation"
    ]
  },
  "function-cot-guardian-tickets": {
    "id": "function-cot-guardian-tickets",
    "title": "Obtaining Guardian Beast Summoning Tickets",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Obtaining Guardian Beast Summoning Tickets"
    ]
  },
  "function-cot-upgrading-city-defense": {
    "id": "function-cot-upgrading-city-defense",
    "title": "Upgrading City Defense",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Upgrading City Defense"
    ]
  },
  "function-cot-in-game-chat": {
    "id": "function-cot-in-game-chat",
    "title": "In-Game Chat in Clash of Thrones",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "In-Game Chat in Clash of Thrones"
    ]
  },
  "function-cot-season-reset": {
    "id": "function-cot-season-reset",
    "title": "Clash of Thrones New Season Reset",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "clash-of-thrones-alliance-and-guardian-beast",
    "section": "Clash of Thrones — Alliance & Guardian Beast",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Clash of Thrones — Alliance & Guardian Beast",
      "Clash of Thrones New Season Reset"
    ]
  },
  "game-level-support-optimized": {
    "id": "game-level-support-optimized",
    "title": "Game Level Optimized",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-overview",
    "section": "Game Level Overview",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Overview",
      "Game Level Optimized"
    ]
  },
  "game-greedy-cat": {
    "id": "game-greedy-cat",
    "title": "Greedy Cat",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Greedy Cat"
    ]
  },
  "game-rocket-crash": {
    "id": "game-rocket-crash",
    "title": "Rocket Crash",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Rocket Crash"
    ]
  },
  "game-multi-fishing": {
    "id": "game-multi-fishing",
    "title": "Multi Fishing",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Multi Fishing"
    ]
  },
  "game-texas-cowboy": {
    "id": "game-texas-cowboy",
    "title": "Texas Cowboy",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Texas Cowboy"
    ]
  },
  "game-center": {
    "id": "game-center",
    "title": "Game Center",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Game Center"
    ]
  },
  "game-lion-tiger": {
    "id": "game-lion-tiger",
    "title": "Lion or Tiger",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Lion or Tiger"
    ]
  },
  "game-yummy": {
    "id": "game-yummy",
    "title": "Yummy",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Yummy"
    ]
  },
  "game-greedy-dice": {
    "id": "game-greedy-dice",
    "title": "Greedy Dice",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Greedy Dice"
    ]
  },
  "game-roulette": {
    "id": "game-roulette",
    "title": "Roulette",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Roulette"
    ]
  },
  "game-slot-game": {
    "id": "game-slot-game",
    "title": "Slot Game",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Slot Game"
    ]
  },
  "game-lucky-match": {
    "id": "game-lucky-match",
    "title": "Lucky Match",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Lucky Match"
    ]
  },
  "game-ludo": {
    "id": "game-ludo",
    "title": "Ludo – Play with Coins",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-level-requirements",
    "section": "Game Level Requirements",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Level Requirements",
      "Ludo – Play with Coins"
    ]
  },
  "game-android-restrictions": {
    "id": "game-android-restrictions",
    "title": "Android Game Restrictions",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-restrictions-and-blacklist",
    "section": "Game Restrictions & Blacklist",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Restrictions & Blacklist",
      "Android Game Restrictions"
    ]
  },
  "game-permanent-restriction": {
    "id": "game-permanent-restriction",
    "title": "Permanent Game Restriction",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-restrictions-and-blacklist",
    "section": "Game Restrictions & Blacklist",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Restrictions & Blacklist",
      "Permanent Game Restriction"
    ]
  },
  "game-blacklist": {
    "id": "game-blacklist",
    "title": "Game Blacklist",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "games-events-and-clash-of-thrones",
    "category": "Games, Events & Clash of Thrones",
    "sectionId": "game-restrictions-and-blacklist",
    "section": "Game Restrictions & Blacklist",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Games, Events & Clash of Thrones",
      "Game Restrictions & Blacklist",
      "Game Blacklist"
    ]
  },
  "withdrawal-exchange-support-optimized": {
    "id": "withdrawal-exchange-support-optimized",
    "title": "Withdrawal & Exchange Optimized",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "optimized-withdrawal-exchange-overview",
    "section": "Optimized Withdrawal / Exchange Overview",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Optimized Withdrawal / Exchange Overview",
      "Withdrawal & Exchange Optimized"
    ]
  },
  "level-withdrawal-threshold-option": {
    "id": "level-withdrawal-threshold-option",
    "title": "Eligibility for Withdrawal Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-eligibility-and-channels",
    "section": "Withdrawal Eligibility & Channels",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Eligibility & Channels",
      "Eligibility for Withdrawal Option"
    ]
  },
  "level-withdrawal-no-option": {
    "id": "level-withdrawal-no-option",
    "title": "No Withdrawal Option Available",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-eligibility-and-channels",
    "section": "Withdrawal Eligibility & Channels",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Eligibility & Channels",
      "No Withdrawal Option Available"
    ]
  },
  "level-withdrawal-threshold-management": {
    "id": "level-withdrawal-threshold-management",
    "title": "Eligibility for Withdrawal Through Management",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-eligibility-and-channels",
    "section": "Withdrawal Eligibility & Channels",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Eligibility & Channels",
      "Eligibility for Withdrawal Through Management"
    ]
  },
  "level-withdrawal-entrance-no-quick": {
    "id": "level-withdrawal-entrance-no-quick",
    "title": "Withdrawal Entrance Available but No Quick Withdrawal Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-eligibility-and-channels",
    "section": "Withdrawal Eligibility & Channels",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Eligibility & Channels",
      "Withdrawal Entrance Available but No Quick Withdrawal Option"
    ]
  },
  "level-withdrawal-quick-channel-not-support": {
    "id": "level-withdrawal-quick-channel-not-support",
    "title": "Quick Withdrawal Available but Specific Channel Not Supported",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-eligibility-and-channels",
    "section": "Withdrawal Eligibility & Channels",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Eligibility & Channels",
      "Quick Withdrawal Available but Specific Channel Not Supported"
    ]
  },
  "level-withdrawal-remove-option": {
    "id": "level-withdrawal-remove-option",
    "title": "Remove Withdrawal / Exchange Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-option-management-and-cancellation",
    "section": "Withdrawal Option Management & Cancellation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Option Management & Cancellation",
      "Remove Withdrawal / Exchange Option"
    ]
  },
  "level-withdrawal-add-option": {
    "id": "level-withdrawal-add-option",
    "title": "Add Withdrawal / Exchange Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-option-management-and-cancellation",
    "section": "Withdrawal Option Management & Cancellation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Option Management & Cancellation",
      "Add Withdrawal / Exchange Option"
    ]
  },
  "level-withdrawal-cancel-pending": {
    "id": "level-withdrawal-cancel-pending",
    "title": "Cancel a Pending Withdrawal Request",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "withdrawal-option-management-and-cancellation",
    "section": "Withdrawal Option Management & Cancellation",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Withdrawal Option Management & Cancellation",
      "Cancel a Pending Withdrawal Request"
    ]
  },
  "level-transfer-threshold-option": {
    "id": "level-transfer-threshold-option",
    "title": "Eligibility for Diamond Transfer Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "diamond-transfer-and-coin-exchange",
    "section": "Diamond Transfer & Coin Exchange",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Diamond Transfer & Coin Exchange",
      "Eligibility for Diamond Transfer Option"
    ]
  },
  "level-exchange-threshold-option": {
    "id": "level-exchange-threshold-option",
    "title": "Eligibility for Exchange Option",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "diamond-transfer-and-coin-exchange",
    "section": "Diamond Transfer & Coin Exchange",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Diamond Transfer & Coin Exchange",
      "Eligibility for Exchange Option"
    ]
  },
  "level-exchange-cannot-search-id": {
    "id": "level-exchange-cannot-search-id",
    "title": "Unable to Search Another User's ID for Coin Exchange",
    "library": "kb",
    "rootTitle": "SUGO Knowledgebase — MENA",
    "categoryId": "withdrawal-transfer-and-exchange",
    "category": "Withdrawal, Transfer & Exchange",
    "sectionId": "diamond-transfer-and-coin-exchange",
    "section": "Diamond Transfer & Coin Exchange",
    "path": [
      "SUGO Knowledgebase — MENA",
      "Withdrawal, Transfer & Exchange",
      "Diamond Transfer & Coin Exchange",
      "Unable to Search Another User's ID for Coin Exchange"
    ]
  },
  "sv-refined-customer-service-greeting": {
    "id": "sv-refined-customer-service-greeting",
    "title": "Customer Service Greeting",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-greetings-first-response",
    "section": "Greetings & First Response",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Greetings & First Response",
      "Customer Service Greeting"
    ]
  },
  "sv-refined-welcome-how-can-we-help": {
    "id": "sv-refined-welcome-how-can-we-help",
    "title": "Welcome / How Can We Help",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-greetings-first-response",
    "section": "Greetings & First Response",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Greetings & First Response",
      "Welcome / How Can We Help"
    ]
  },
  "sv-refined-request-customer-id": {
    "id": "sv-refined-request-customer-id",
    "title": "Request Customer ID",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-account-id-missing-info",
    "section": "Account ID & Missing Info",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Account ID & Missing Info",
      "Request Customer ID"
    ]
  },
  "sv-refined-request-id-and-issue-video": {
    "id": "sv-refined-request-id-and-issue-video",
    "title": "Request ID + Issue Video",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-account-id-missing-info",
    "section": "Account ID & Missing Info",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Account ID & Missing Info",
      "Request ID + Issue Video"
    ]
  },
  "sv-refined-contact-from-same-account": {
    "id": "sv-refined-contact-from-same-account",
    "title": "Ask to Contact From Same Account",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-account-id-missing-info",
    "section": "Account ID & Missing Info",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Account ID & Missing Info",
      "Ask to Contact From Same Account"
    ]
  },
  "sv-refined-request-submitted-follow-up": {
    "id": "sv-refined-request-submitted-follow-up",
    "title": "Request Submitted / Follow-Up",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-follow-up-conversation-handling",
    "section": "Follow-up & Conversation Handling",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Follow-up & Conversation Handling",
      "Request Submitted / Follow-Up"
    ]
  },
  "sv-refined-duplicate-conversation": {
    "id": "sv-refined-duplicate-conversation",
    "title": "Duplicate Conversation",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-general-support-intake",
    "category": "General Support & Intake",
    "sectionId": "sv-better-general-support-intake-follow-up-conversation-handling",
    "section": "Follow-up & Conversation Handling",
    "path": [
      "SUGO SV — Organized Support Macros",
      "General Support & Intake",
      "Follow-up & Conversation Handling",
      "Duplicate Conversation"
    ]
  },
  "sv-refined-account-ownership-verification": {
    "id": "sv-refined-account-ownership-verification",
    "title": "Account Ownership Verification",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-ownership-verification",
    "section": "Ownership Verification",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Ownership Verification",
      "Account Ownership Verification"
    ]
  },
  "sv-refined-phone-binding-request-submitted": {
    "id": "sv-refined-phone-binding-request-submitted",
    "title": "Phone Binding Request Submitted",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-phone-binding-password",
    "section": "Phone Binding & Password",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Phone Binding & Password",
      "Phone Binding Request Submitted"
    ]
  },
  "sv-refined-password-reset-request-submitted": {
    "id": "sv-refined-password-reset-request-submitted",
    "title": "Password Reset Request Submitted",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-phone-binding-password",
    "section": "Phone Binding & Password",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Phone Binding & Password",
      "Password Reset Request Submitted"
    ]
  },
  "sv-refined-unban-identity-video": {
    "id": "sv-refined-unban-identity-video",
    "title": "Identity Video Required",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-identity-review-verification",
    "section": "Identity Review & Verification",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Identity Review & Verification",
      "Identity Video Required"
    ]
  },
  "sv-refined-unban-review-male-using-female-account-video-sent": {
    "id": "sv-refined-unban-review-male-using-female-account-video-sent",
    "title": "Review Sent: Male Using Female Account",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-identity-review-verification",
    "section": "Identity Review & Verification",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Identity Review & Verification",
      "Review Sent: Male Using Female Account"
    ]
  },
  "sv-refined-unban-review-underage-verification-video-sent": {
    "id": "sv-refined-unban-review-underage-verification-video-sent",
    "title": "Review Sent: Underage Verification",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-identity-review-verification",
    "section": "Identity Review & Verification",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Identity Review & Verification",
      "Review Sent: Underage Verification"
    ]
  },
  "sv-refined-verification-rejected": {
    "id": "sv-refined-verification-rejected",
    "title": "Verification Rejected",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-account-access-verification",
    "category": "Account Access & Verification",
    "sectionId": "sv-better-account-access-verification-identity-review-verification",
    "section": "Identity Review & Verification",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Account Access & Verification",
      "Identity Review & Verification",
      "Verification Rejected"
    ]
  },
  "sv-refined-report-abuse-case": {
    "id": "sv-refined-report-abuse-case",
    "title": "Report Abuse Case",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-reports-abuse-evidence",
    "category": "Reports, Abuse & Evidence",
    "sectionId": "sv-better-reports-abuse-evidence-abuse-reports",
    "section": "Abuse Reports",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Reports, Abuse & Evidence",
      "Abuse Reports",
      "Report Abuse Case"
    ]
  },
  "sv-refined-report-abuse-evidence": {
    "id": "sv-refined-report-abuse-evidence",
    "title": "Report Abuse Evidence",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-reports-abuse-evidence",
    "category": "Reports, Abuse & Evidence",
    "sectionId": "sv-better-reports-abuse-evidence-abuse-reports",
    "section": "Abuse Reports",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Reports, Abuse & Evidence",
      "Abuse Reports",
      "Report Abuse Evidence"
    ]
  },
  "sv-refined-report-insulting-management": {
    "id": "sv-refined-report-insulting-management",
    "title": "Report Insulting Management",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-reports-abuse-evidence",
    "category": "Reports, Abuse & Evidence",
    "sectionId": "sv-better-reports-abuse-evidence-abuse-reports",
    "section": "Abuse Reports",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Reports, Abuse & Evidence",
      "Abuse Reports",
      "Report Insulting Management"
    ]
  },
  "sv-refined-report-issue-case": {
    "id": "sv-refined-report-issue-case",
    "title": "Report Technical Issue",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-reports-abuse-evidence",
    "category": "Reports, Abuse & Evidence",
    "sectionId": "sv-better-reports-abuse-evidence-technical-issue-evidence",
    "section": "Technical Issue Evidence",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Reports, Abuse & Evidence",
      "Technical Issue Evidence",
      "Report Technical Issue"
    ]
  },
  "sv-refined-moments-watermark-removal": {
    "id": "sv-refined-moments-watermark-removal",
    "title": "Moments / Watermark Removal",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-reports-abuse-evidence",
    "category": "Reports, Abuse & Evidence",
    "sectionId": "sv-better-reports-abuse-evidence-moments-content-cleanup",
    "section": "Moments & Content Cleanup",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Reports, Abuse & Evidence",
      "Moments & Content Cleanup",
      "Moments / Watermark Removal"
    ]
  },
  "sv-refined-ban-reason-placeholder": {
    "id": "sv-refined-ban-reason-placeholder",
    "title": "Ban Reason Placeholder",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-general-ban-handling",
    "section": "General Ban Handling",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "General Ban Handling",
      "Ban Reason Placeholder"
    ]
  },
  "sv-refined-request-unban-apology": {
    "id": "sv-refined-request-unban-apology",
    "title": "Request Unban / Apology",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-general-ban-handling",
    "section": "General Ban Handling",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "General Ban Handling",
      "Request Unban / Apology"
    ]
  },
  "sv-refined-medium-risk-requirements": {
    "id": "sv-refined-medium-risk-requirements",
    "title": "Medium Risk Requirements",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-general-ban-handling",
    "section": "General Ban Handling",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "General Ban Handling",
      "Medium Risk Requirements"
    ]
  },
  "sv-refined-high-risk-restriction": {
    "id": "sv-refined-high-risk-restriction",
    "title": "High-Risk Restriction",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-general-ban-handling",
    "section": "General Ban Handling",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "General Ban Handling",
      "High-Risk Restriction"
    ]
  },
  "sv-refined-ban-male-using-female-account": {
    "id": "sv-refined-ban-male-using-female-account",
    "title": "Ban: Male Using Female Account",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-identity-age-account-misuse",
    "section": "Identity / Age / Account Misuse",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Identity / Age / Account Misuse",
      "Ban: Male Using Female Account"
    ]
  },
  "sv-refined-ban-underage-suspicion": {
    "id": "sv-refined-ban-underage-suspicion",
    "title": "Ban: Underage Suspicion",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-identity-age-account-misuse",
    "section": "Identity / Age / Account Misuse",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Identity / Age / Account Misuse",
      "Ban: Underage Suspicion"
    ]
  },
  "sv-refined-ban-vpn-region-violation": {
    "id": "sv-refined-ban-vpn-region-violation",
    "title": "Ban: VPN / Region Violation",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-identity-age-account-misuse",
    "section": "Identity / Age / Account Misuse",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Identity / Age / Account Misuse",
      "Ban: VPN / Region Violation"
    ]
  },
  "sv-refined-ban-external-contact-phone-number": {
    "id": "sv-refined-ban-external-contact-phone-number",
    "title": "Ban: External Contact / Phone Number",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-identity-age-account-misuse",
    "section": "Identity / Age / Account Misuse",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Identity / Age / Account Misuse",
      "Ban: External Contact / Phone Number"
    ]
  },
  "sv-refined-ban-external-contact-telegram": {
    "id": "sv-refined-ban-external-contact-telegram",
    "title": "Ban: External Contact / Telegram",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-identity-age-account-misuse",
    "section": "Identity / Age / Account Misuse",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Identity / Age / Account Misuse",
      "Ban: External Contact / Telegram"
    ]
  },
  "sv-refined-ban-sexual-commerce": {
    "id": "sv-refined-ban-sexual-commerce",
    "title": "Ban: Sexual Commerce",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Commerce"
    ]
  },
  "sv-refined-ban-sexual-content-in-messages": {
    "id": "sv-refined-ban-sexual-content-in-messages",
    "title": "Ban: Sexual Content in Messages",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Content in Messages"
    ]
  },
  "sv-refined-ban-sexual-messages": {
    "id": "sv-refined-ban-sexual-messages",
    "title": "Ban: Sexual Messages",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Messages"
    ]
  },
  "sv-refined-ban-sexual-picture": {
    "id": "sv-refined-ban-sexual-picture",
    "title": "Ban: Sexual Picture",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Picture"
    ]
  },
  "sv-refined-ban-sexual-video": {
    "id": "sv-refined-ban-sexual-video",
    "title": "Ban: Sexual Video",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Video"
    ]
  },
  "sv-refined-ban-sexual-moments": {
    "id": "sv-refined-ban-sexual-moments",
    "title": "Ban: Sexual Moments",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Moments"
    ]
  },
  "sv-refined-ban-sexual-offer": {
    "id": "sv-refined-ban-sexual-offer",
    "title": "Ban: Sexual Offer",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-sexual-policy-violations",
    "section": "Sexual Policy Violations",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Sexual Policy Violations",
      "Ban: Sexual Offer"
    ]
  },
  "sv-refined-ban-smoking-during-live": {
    "id": "sv-refined-ban-smoking-during-live",
    "title": "Ban: Smoking During Live",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Smoking During Live"
    ]
  },
  "sv-refined-ban-smoking-image": {
    "id": "sv-refined-ban-smoking-image",
    "title": "Ban: Smoking Image",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Smoking Image"
    ]
  },
  "sv-refined-ban-drug-use-during-live": {
    "id": "sv-refined-ban-drug-use-during-live",
    "title": "Ban: Drug Use During Live",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Drug Use During Live"
    ]
  },
  "sv-refined-ban-drug-use-image": {
    "id": "sv-refined-ban-drug-use-image",
    "title": "Ban: Drug Use Image",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Drug Use Image"
    ]
  },
  "sv-refined-ban-weapon-during-live": {
    "id": "sv-refined-ban-weapon-during-live",
    "title": "Ban: Weapon During Live",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Weapon During Live"
    ]
  },
  "sv-refined-ban-weapon-image": {
    "id": "sv-refined-ban-weapon-image",
    "title": "Ban: Weapon Image",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Weapon Image"
    ]
  },
  "sv-refined-ban-insulting-another-user": {
    "id": "sv-refined-ban-insulting-another-user",
    "title": "Ban: Insulting Another User",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-safety-prohibited-content",
    "section": "Safety & Prohibited Content",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Safety & Prohibited Content",
      "Ban: Insulting Another User"
    ]
  },
  "sv-refined-ban-promoting-other-platforms": {
    "id": "sv-refined-ban-promoting-other-platforms",
    "title": "Ban: Promoting Other Platforms",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-promotion-impersonation",
    "section": "Promotion & Impersonation",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Promotion & Impersonation",
      "Ban: Promoting Other Platforms"
    ]
  },
  "sv-refined-ban-pretending-to-be-management": {
    "id": "sv-refined-ban-pretending-to-be-management",
    "title": "Ban: Pretending to Be Management",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-promotion-impersonation",
    "section": "Promotion & Impersonation",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Promotion & Impersonation",
      "Ban: Pretending to Be Management"
    ]
  },
  "sv-refined-ban-pretending-to-be-a-coin-seller": {
    "id": "sv-refined-ban-pretending-to-be-a-coin-seller",
    "title": "Ban: Pretending to Be Coin Seller",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-ban-restriction-management",
    "category": "Ban & Restriction Management",
    "sectionId": "sv-better-ban-restriction-management-promotion-impersonation",
    "section": "Promotion & Impersonation",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Ban & Restriction Management",
      "Promotion & Impersonation",
      "Ban: Pretending to Be Coin Seller"
    ]
  },
  "sv-refined-recharge-general-guide": {
    "id": "sv-refined-recharge-general-guide",
    "title": "Recharge General Guide",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-recharge-guides",
    "section": "Recharge Guides",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Recharge Guides",
      "Recharge General Guide"
    ]
  },
  "sv-refined-recharge-methods": {
    "id": "sv-refined-recharge-methods",
    "title": "Recharge Methods",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-recharge-guides",
    "section": "Recharge Guides",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Recharge Guides",
      "Recharge Methods"
    ]
  },
  "sv-refined-recharge-steps": {
    "id": "sv-refined-recharge-steps",
    "title": "Recharge Steps",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-recharge-guides",
    "section": "Recharge Guides",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Recharge Guides",
      "Recharge Steps"
    ]
  },
  "sv-refined-recharge-link": {
    "id": "sv-refined-recharge-link",
    "title": "Recharge Link",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-recharge-guides",
    "section": "Recharge Guides",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Recharge Guides",
      "Recharge Link"
    ]
  },
  "sv-refined-recharge-through-visa": {
    "id": "sv-refined-recharge-through-visa",
    "title": "Recharge Through Visa",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-recharge-guides",
    "section": "Recharge Guides",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Recharge Guides",
      "Recharge Through Visa"
    ]
  },
  "sv-refined-first-recharge-requirement": {
    "id": "sv-refined-first-recharge-requirement",
    "title": "First Recharge Requirement",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-recharge-guides",
    "section": "Recharge Guides",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Recharge Guides",
      "First Recharge Requirement"
    ]
  },
  "sv-refined-recharge-failed-alternatives": {
    "id": "sv-refined-recharge-failed-alternatives",
    "title": "Recharge Failed / Alternatives",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-payment-problems-evidence",
    "section": "Payment Problems & Evidence",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Payment Problems & Evidence",
      "Recharge Failed / Alternatives"
    ]
  },
  "sv-refined-request-recharge-invoice": {
    "id": "sv-refined-request-recharge-invoice",
    "title": "Request Recharge Invoice",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-payment-problems-evidence",
    "section": "Payment Problems & Evidence",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Payment Problems & Evidence",
      "Request Recharge Invoice"
    ]
  },
  "sv-refined-coins-not-received": {
    "id": "sv-refined-coins-not-received",
    "title": "Coins Not Received",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-payment-problems-evidence",
    "section": "Payment Problems & Evidence",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Payment Problems & Evidence",
      "Coins Not Received"
    ]
  },
  "sv-refined-recharge-through-agency-egypt": {
    "id": "sv-refined-recharge-through-agency-egypt",
    "title": "Recharge Agency - Egypt",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-country-recharge-agencies",
    "section": "Country Recharge Agencies",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Country Recharge Agencies",
      "Recharge Agency - Egypt"
    ]
  },
  "sv-refined-recharge-through-agency-iraq": {
    "id": "sv-refined-recharge-through-agency-iraq",
    "title": "Recharge Agency - Iraq",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-country-recharge-agencies",
    "section": "Country Recharge Agencies",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Country Recharge Agencies",
      "Recharge Agency - Iraq"
    ]
  },
  "sv-refined-recharge-through-agency-saudi-arabia": {
    "id": "sv-refined-recharge-through-agency-saudi-arabia",
    "title": "Recharge Agency - Saudi Arabia",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-country-recharge-agencies",
    "section": "Country Recharge Agencies",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Country Recharge Agencies",
      "Recharge Agency - Saudi Arabia"
    ]
  },
  "sv-refined-recharge-through-agency-syria": {
    "id": "sv-refined-recharge-through-agency-syria",
    "title": "Recharge Agency - Syria",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-country-recharge-agencies",
    "section": "Country Recharge Agencies",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Country Recharge Agencies",
      "Recharge Agency - Syria"
    ]
  },
  "sv-refined-recharge-through-agency-uae": {
    "id": "sv-refined-recharge-through-agency-uae",
    "title": "Recharge Agency - UAE",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-country-recharge-agencies",
    "section": "Country Recharge Agencies",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "Country Recharge Agencies",
      "Recharge Agency - UAE"
    ]
  },
  "sv-refined-elite-club-conditions": {
    "id": "sv-refined-elite-club-conditions",
    "title": "Elite Club Conditions",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-recharge-coins-vip",
    "category": "Recharge, Coins & VIP",
    "sectionId": "sv-better-recharge-coins-vip-vip-elite-club",
    "section": "VIP & Elite Club",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Recharge, Coins & VIP",
      "VIP & Elite Club",
      "Elite Club Conditions"
    ]
  },
  "sv-refined-withdrawal-waiting-period": {
    "id": "sv-refined-withdrawal-waiting-period",
    "title": "Withdrawal Waiting Period",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-status-delays",
    "section": "Withdrawal Status & Delays",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Status & Delays",
      "Withdrawal Waiting Period"
    ]
  },
  "sv-refined-withdrawal-successful-but-not-received": {
    "id": "sv-refined-withdrawal-successful-but-not-received",
    "title": "Successful but Not Received",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-status-delays",
    "section": "Withdrawal Status & Delays",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Status & Delays",
      "Successful but Not Received"
    ]
  },
  "sv-refined-request-withdrawal-screenshot": {
    "id": "sv-refined-request-withdrawal-screenshot",
    "title": "Request Withdrawal Screenshot",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-status-delays",
    "section": "Withdrawal Status & Delays",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Status & Delays",
      "Request Withdrawal Screenshot"
    ]
  },
  "sv-refined-fast-withdrawal-conditions": {
    "id": "sv-refined-fast-withdrawal-conditions",
    "title": "Fast Withdrawal Conditions",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-methods-conditions",
    "section": "Withdrawal Methods & Conditions",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Methods & Conditions",
      "Fast Withdrawal Conditions"
    ]
  },
  "sv-refined-withdrawal-through-management": {
    "id": "sv-refined-withdrawal-through-management",
    "title": "Withdrawal Through Management",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-methods-conditions",
    "section": "Withdrawal Methods & Conditions",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Methods & Conditions",
      "Withdrawal Through Management"
    ]
  },
  "sv-refined-cancel-withdrawal-request": {
    "id": "sv-refined-cancel-withdrawal-request",
    "title": "Cancel Withdrawal Request",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-requests-options",
    "section": "Withdrawal Requests & Options",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Requests & Options",
      "Cancel Withdrawal Request"
    ]
  },
  "sv-refined-add-remove-withdrawal-option": {
    "id": "sv-refined-add-remove-withdrawal-option",
    "title": "Add / Remove Withdrawal Option",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-withdrawal-salary",
    "category": "Withdrawal & Salary",
    "sectionId": "sv-better-withdrawal-salary-withdrawal-requests-options",
    "section": "Withdrawal Requests & Options",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Withdrawal & Salary",
      "Withdrawal Requests & Options",
      "Add / Remove Withdrawal Option"
    ]
  },
  "sv-refined-create-host-agency": {
    "id": "sv-refined-create-host-agency",
    "title": "Create Host Agency",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-host-agency-creation",
    "section": "Host Agency Creation",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Host Agency Creation",
      "Create Host Agency"
    ]
  },
  "sv-refined-apply-to-open-host-agency": {
    "id": "sv-refined-apply-to-open-host-agency",
    "title": "Apply to Open Host Agency",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-host-agency-creation",
    "section": "Host Agency Creation",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Host Agency Creation",
      "Apply to Open Host Agency"
    ]
  },
  "sv-refined-change-agency-for-anchor": {
    "id": "sv-refined-change-agency-for-anchor",
    "title": "Change Agency for Anchor",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-agency-transfer-sub-agency",
    "section": "Agency Transfer & Sub-Agency",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Agency Transfer & Sub-Agency",
      "Change Agency for Anchor"
    ]
  },
  "sv-refined-agency-transfer-request": {
    "id": "sv-refined-agency-transfer-request",
    "title": "Agency Transfer Request",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-agency-transfer-sub-agency",
    "section": "Agency Transfer & Sub-Agency",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Agency Transfer & Sub-Agency",
      "Agency Transfer Request"
    ]
  },
  "sv-refined-create-sub-agency": {
    "id": "sv-refined-create-sub-agency",
    "title": "Create Sub-Agency",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-agency-transfer-sub-agency",
    "section": "Agency Transfer & Sub-Agency",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Agency Transfer & Sub-Agency",
      "Create Sub-Agency"
    ]
  },
  "sv-refined-change-sub-agency-to-main-agency": {
    "id": "sv-refined-change-sub-agency-to-main-agency",
    "title": "Change Sub-Agency to Main Agency",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-agency-transfer-sub-agency",
    "section": "Agency Transfer & Sub-Agency",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Agency Transfer & Sub-Agency",
      "Change Sub-Agency to Main Agency"
    ]
  },
  "sv-refined-agency-admin-whatsapp-group-requirements": {
    "id": "sv-refined-agency-admin-whatsapp-group-requirements",
    "title": "Admin WhatsApp Group Requirements",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-agency-management-requirements",
    "section": "Agency Management Requirements",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Agency Management Requirements",
      "Admin WhatsApp Group Requirements"
    ]
  },
  "sv-refined-create-recharge-agency": {
    "id": "sv-refined-create-recharge-agency",
    "title": "Create Recharge Agency",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-agency-host-operations",
    "category": "Agency & Host Operations",
    "sectionId": "sv-better-agency-host-operations-agency-management-requirements",
    "section": "Agency Management Requirements",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Agency & Host Operations",
      "Agency Management Requirements",
      "Create Recharge Agency"
    ]
  },
  "sv-refined-games-access-conditions": {
    "id": "sv-refined-games-access-conditions",
    "title": "Games Access Conditions",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-games-access-rules",
    "section": "Games Access Rules",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Games Access Rules",
      "Games Access Conditions"
    ]
  },
  "sv-refined-game-access-information": {
    "id": "sv-refined-game-access-information",
    "title": "Game Access Information",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-games-access-rules",
    "section": "Games Access Rules",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Games Access Rules",
      "Game Access Information"
    ]
  },
  "sv-refined-game-access-information-alternative": {
    "id": "sv-refined-game-access-information-alternative",
    "title": "Game Access Information - Alternative",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-games-access-rules",
    "section": "Games Access Rules",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Games Access Rules",
      "Game Access Information - Alternative"
    ]
  },
  "sv-refined-add-game-request": {
    "id": "sv-refined-add-game-request",
    "title": "Add Game Request",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-add-remove-games",
    "section": "Add / Remove Games",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Add / Remove Games",
      "Add Game Request"
    ]
  },
  "sv-refined-add-games-request": {
    "id": "sv-refined-add-games-request",
    "title": "Add Games Request",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-add-remove-games",
    "section": "Add / Remove Games",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Add / Remove Games",
      "Add Games Request"
    ]
  },
  "sv-refined-remove-game-request": {
    "id": "sv-refined-remove-game-request",
    "title": "Remove Game Request",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-add-remove-games",
    "section": "Add / Remove Games",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Add / Remove Games",
      "Remove Game Request"
    ]
  },
  "sv-refined-remove-games-request": {
    "id": "sv-refined-remove-games-request",
    "title": "Remove Games Request",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-add-remove-games",
    "section": "Add / Remove Games",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Add / Remove Games",
      "Remove Games Request"
    ]
  },
  "sv-refined-matching-issue-1": {
    "id": "sv-refined-matching-issue-1",
    "title": "Matching Issue 1",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-matching-issues",
    "section": "Matching Issues",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Matching Issues",
      "Matching Issue 1"
    ]
  },
  "sv-refined-matching-issue-2": {
    "id": "sv-refined-matching-issue-2",
    "title": "Matching Issue 2",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-matching-issues",
    "section": "Matching Issues",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Matching Issues",
      "Matching Issue 2"
    ]
  },
  "sv-refined-matching-issue-3": {
    "id": "sv-refined-matching-issue-3",
    "title": "Matching Issue 3",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-matching-issues",
    "section": "Matching Issues",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Matching Issues",
      "Matching Issue 3"
    ]
  },
  "sv-refined-daily-and-family-tasks": {
    "id": "sv-refined-daily-and-family-tasks",
    "title": "Daily and Family Tasks",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-games-matching-tasks",
    "category": "Games, Matching & Tasks",
    "sectionId": "sv-better-games-matching-tasks-tasks",
    "section": "Tasks",
    "path": [
      "SUGO SV — Organized Support Macros",
      "Games, Matching & Tasks",
      "Tasks",
      "Daily and Family Tasks"
    ]
  },
  "sv-refined-app-crash-refresh-steps": {
    "id": "sv-refined-app-crash-refresh-steps",
    "title": "App Crash / Refresh Steps",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-app-settings-country-location",
    "category": "App Settings, Country & Location",
    "sectionId": "sv-better-app-settings-country-location-app-crash-technical-logs",
    "section": "App Crash & Technical Logs",
    "path": [
      "SUGO SV — Organized Support Macros",
      "App Settings, Country & Location",
      "App Crash & Technical Logs",
      "App Crash / Refresh Steps"
    ]
  },
  "sv-refined-app-crash-upload-log": {
    "id": "sv-refined-app-crash-upload-log",
    "title": "App Crash / Upload Log",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-app-settings-country-location",
    "category": "App Settings, Country & Location",
    "sectionId": "sv-better-app-settings-country-location-app-crash-technical-logs",
    "section": "App Crash & Technical Logs",
    "path": [
      "SUGO SV — Organized Support Macros",
      "App Settings, Country & Location",
      "App Crash & Technical Logs",
      "App Crash / Upload Log"
    ]
  },
  "sv-refined-change-country": {
    "id": "sv-refined-change-country",
    "title": "Change Country",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-app-settings-country-location",
    "category": "App Settings, Country & Location",
    "sectionId": "sv-better-app-settings-country-location-country-location-settings",
    "section": "Country & Location Settings",
    "path": [
      "SUGO SV — Organized Support Macros",
      "App Settings, Country & Location",
      "Country & Location Settings",
      "Change Country"
    ]
  },
  "sv-refined-change-country-follow-up": {
    "id": "sv-refined-change-country-follow-up",
    "title": "Change Country Follow-Up",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-app-settings-country-location",
    "category": "App Settings, Country & Location",
    "sectionId": "sv-better-app-settings-country-location-country-location-settings",
    "section": "Country & Location Settings",
    "path": [
      "SUGO SV — Organized Support Macros",
      "App Settings, Country & Location",
      "Country & Location Settings",
      "Change Country Follow-Up"
    ]
  },
  "sv-refined-close-location-hide-distance": {
    "id": "sv-refined-close-location-hide-distance",
    "title": "Close Location / Hide Distance",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-app-settings-country-location",
    "category": "App Settings, Country & Location",
    "sectionId": "sv-better-app-settings-country-location-country-location-settings",
    "section": "Country & Location Settings",
    "path": [
      "SUGO SV — Organized Support Macros",
      "App Settings, Country & Location",
      "Country & Location Settings",
      "Close Location / Hide Distance"
    ]
  },
  "sv-refined-location-disappeared": {
    "id": "sv-refined-location-disappeared",
    "title": "Location Disappeared",
    "library": "sv",
    "rootTitle": "SUGO SV — Organized Support Macros",
    "categoryId": "sv-better-app-settings-country-location",
    "category": "App Settings, Country & Location",
    "sectionId": "sv-better-app-settings-country-location-country-location-settings",
    "section": "Country & Location Settings",
    "path": [
      "SUGO SV — Organized Support Macros",
      "App Settings, Country & Location",
      "Country & Location Settings",
      "Location Disappeared"
    ]
  }
};
  const stats = {
  "rootCount": 2,
  "categoryCount": 16,
  "sectionCount": 72,
  "topicCount": 284,
  "byLibrary": {
    "kb": {
      "categories": 7,
      "sections": 42,
      "topics": 192
    },
    "sv": {
      "categories": 9,
      "sections": 30,
      "topics": 92
    }
  }
};

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    return value;
  }

  function getLibrary(libraryId) {
    const id = String(libraryId || "").trim();
    return navigation.find((library) => library.id === id) || null;
  }

  function getTopic(paneId) {
    const id = String(paneId || "").trim();
    return id && Object.prototype.hasOwnProperty.call(topicsById, id)
      ? topicsById[id]
      : null;
  }

  function getPane(paneId) {
    const id = String(paneId || "").trim();
    return window.SUGO?.KnowledgeBaseContent?.getPane(id) || null;
  }

  window.SUGO = window.SUGO || {};
  window.SUGO.KnowledgeBaseData = deepFreeze({
    version: "phase-7b-navigation-and-content",
    navigation,
    topicsById,
    stats,
    getLibrary,
    getTopic,
    getPane
  });
})();
