export type Language = 'en' | 'am';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Navigation
    nav: {
      home: "Heritage",
      products: "Marketplace",
      festivals: "Festivals",
      about: "Our Mission",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard"
    },

    // Header
    header: {
      searchPlaceholder: "Search...",
      welcome: "Welcome",
      signInRegister: "Sign in / Register",
      newHere: "New here?",
      myOrders: "My Orders",
      messageCenter: "Message Center",
      payments: "Payment",
      wishlist: "Wish List",
      settings: "Settings",
      helpCenter: "Help Center",
      disputes: "Disputes",
      signOut: "Sign Out",
      loginRequired: "Login Required",
      loginDesc: "Please login as a Tourist to proceed to checkout.",
      loginNow: "Login Now",
      cancel: "Cancel"
    },

    // Cart & Checkout
    cart: {
      yourCart: "Your Cart",
      selectPayment: "Select Payment",
      choosePayment: "Choose a secure payment method to complete your order.",
      chapa: "Chapa",
      telebirr: "Telebirr",
      payWithCardBank: "Pay with Card / Bank",
      mobileMoney: "Mobile Money",
      processingPayment: "Processing Payment",
      paymentWait: "Please wait while we secure your transaction...",
      orderConfirmedMsg: "Thank you for your purchase. A confirmation email has been sent to you.",
      transactionId: "Transaction ID",
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      proceedToCheckout: "Proceed to Checkout",
      back: "Back",
      payNow: "Pay Now",
      secureCheckout: "Secure checkout powered by Chapa & Telebirr"
    },

    // Footer
    footer: {
      tagline: "Preserving centuries of Ethiopian craftsmanship through a secure, unified marketplace aligned with the Digital Ethiopia 2025 strategy.",
      heritageExplorer: "Heritage Explorer",
      curatedMarketplace: "Curated Marketplace",
      sacredCelebrations: "Sacred Celebrations",
      artisanStories: "Artisan Stories",
      regionalGuides: "Regional Guides",
      supportTrust: "Support & Trust",
      helpCenter: "Help Center",
      authenticityShield: "Authenticity Shield",
      shippingReturns: "Shipping & Returns",
      contactOffice: "Contact Heritage Office",
      hubDispatch: "Hub Dispatch",
      newsletterText: "Join 50,000+ explorers getting early access to festival tickets and new artifact arrivals.",
      emailPlaceholder: "Guardian email address",
      subscribe: "Subscribe",
      copyright: "© 2025 Ethio-Craft Hub • A Cultural Unified Network",
      privacy: "Privacy",
      terms: "Terms",
      international: "International"
    },

    // Common UI
    common: {
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      viewAll: "View All",
      loadMore: "Load More",
      noResults: "No results found",
      all: "All",
      saving: "Saving...",
      saved: "Saved",
      delete: "Delete",
      edit: "Edit",
      cancel: "Cancel",
      confirm: "Confirm",
      submit: "Submit",
      back: "Back",
      next: "Next",
      previous: "Previous",
      close: "Close",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Info",
      yes: "Yes",
      no: "No"
    },

    // Auth
    auth: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      rememberMe: "Remember me",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      signUp: "Sign Up",
      signIn: "Sign In"
    },

    // Dashboard
    dashboard: {
      overview: "Overview",
      settings: "Settings",
      profile: "Profile",
      notifications: "Notifications",
      bookings: "My Bookings",
      payments: "Payments",
      wishlist: "Wishlist"
    },

    // Admin
    admin: {
      verificationModeration: "Verification & Moderation",
      eventVerificationDesc: "Review, approve, and audit event submissions.",
      requestResubmission: "Request Resubmission",
      resubmit: {
        youAreAsking: "You are asking",
        toResubmit: "to resubmit documents for"
      },
      itemsToCorrect: "Items to Correct",
      itemsToCorrectPlaceholder: "List the documents or information that need correction...",
      sendRequest: "Send Request",
      rejectEvent: "Reject Event",
      youAreRejecting: "You are rejecting",
      willNotifyOrganizer: "This action will notify the organizer.",
      reasonForRejection: "Reason for Rejection",
      reasons: {
        incompleteInfo: "Incomplete information",
        invalidLocation: "Invalid location",
        suspiciousActivity: "Suspicious activity",
        policyViolation: "Policy violation",
        duplicateEvent: "Duplicate event",
        other: "Other"
      },
      customMessage: "Custom Message to Organizer",
      customMessagePlaceholder: "Provide specific details about why this event was rejected...",
      confirmRejection: "Confirm Rejection",
      approveEvent: "Approve Event",
      approveConfirmation: "Are you sure you want to approve {event}? This will make the event live on the platform immediately.",
      commissionRate: "Commission Rate",
      estimatedCommission: "Est. Total Commission",
      optionalNote: "Optional Note to Organizer",
      optionalNotePlaceholder: "Good luck with your event!...",
      confirmApproval: "Confirm Approval",
      viewProfile: "View Profile",
      userVerifications: "User Verifications",
      eventVerifications: "Event Verifications",
      productVerifications: "Product Verifications",
      pendingUsers: "Pending Users",
      pendingEvents: "Pending Events",
      pendingProducts: "Pending Products",
      approve: "Approve",
      reject: "Reject",
      review: "Review",
      status: "Status",
      submittedOn: "Submitted On",
      documents: "Documents",
      actions: "Actions"
    },

    // User Verification
    userVerification: {
      verificationRequests: "Verification Requests",
      businessName: "Business Name",
      category: "Category",
      region: "Region",
      city: "City",
      submittedAt: "Submitted At",
      approved: "Approved",
      rejected: "Rejected",
      underReview: "Under Review",
      pending: "Pending"
    },

    // Events
    events: {
      eventVerification: "Event Verification",
      eventVerificationDesc: "Review, approve, and audit event submissions.",
      eventDetails: "Event Verification Details",
      title: "Event Title",
      description: "Description",
      location: "Location",
      date: "Date",
      time: "Time",
      capacity: "Capacity",
      organizer: "Organizer",
      pricingStructure: "Pricing Structure",
      ticketTypes: "Ticket Types",
      commissionRate: "Commission Rate",
      estimatedCommission: "Est. Total Commission",
      submittedDocuments: "Submitted Documents",
      requestResubmission: "Request Resubmission",
      rejectEvent: "Reject Event",
      approveEvent: "Approve Event",
      noMatchFilters: "No events match your current filters.",
      rejectionReason: "Rejection Reason",
      reVerificationRequired: "Re-verification Required",
      organizerChanges: "Organizer made changes to this published event. Please review the updates.",
      lastEdited: "Last edited:",
      pastEvents: "Past Events",
      verified: "Verified",
      lowRisk: "Low Risk Detected",
      includedServices: "Included Services",
      eventPolicies: "Event Policies",
      sections: {
        media: "Event Media",
        coreInfo: "Core Information",
        schedule: "Event Schedule",
        hotels: "Partner Hotels",
        transportation: "Transportation",
        documents: "Submitted Documents",
        pricing: "Pricing Structure",
        servicesPolicies: "Services & Policies",
        organizerInfo: "Organizer Info",
        risk: "Risk Analysis"
      }
    },

    // Products
    products: {
      productVerification: "Product Verification",
      artisanProfile: "Artisan Profile",
      pricing: "Pricing",
      materials: "Materials",
      careInstructions: "Care Instructions",
      sku: "SKU",
      stock: "Stock",
      shipping: "Shipping",
      deliveryTime: "Delivery Time"
    },

    // Forms
    forms: {
      required: "Required",
      optional: "Optional",
      upload: "Upload",
      dragDrop: "or drag and drop",
      fileTypes: "SVG, PNG, JPG or GIF (max. 800x400px)",
      addImage: "Add Image",
      addFile: "Add File"
    },

    // Documents
    documents: {
      files: "Files",
      preview: "Preview",
      download: "Download"
    },

    // Status & Badges
    status: {
      active: "Active",
      suspended: "Suspended",
      deleted: "Deleted",
      draft: "Draft",
      published: "Published",
      archived: "Archived",
      pendingApproval: "Pending Review",
      underReview: "Under Review",
      pendingReVerification: "Pending Re-verification"
    },

    // Errors & Messages
    messages: {
      somethingWentWrong: "Something went wrong",
      tryAgain: "Please try again",
      noChanges: "No changes to save",
      changesSaved: "Changes saved successfully",
      deleteConfirm: "Are you sure you want to delete this item?",
      actionRequired: "Action Required"
    }
  },

   am: {
     // Navigation
     nav: {
       home: "ልምምር",
       products: "መገበያ",
       festivals: "በዓላት",
       about: "ተልእኮአችን",
       login: "ግባ",
       register: "ተመዝገብ",
       logout: "ውጣ",
       dashboard: "ዳሽ ቦርድ"
     },

      // Common UI
      common: {
        search: "ፍለጋ",
        filter: "አጣራ",
        sort: "አስተሳሰር",
        viewAll: "ሁሉን እንይ",
        loadMore: "ተጫውር",
        noResults: "የለውም የተገኘ",
        all: "ሁሉን",
        saving: "በማስቀመጥ ላይ...",
        saved: "ተቀምጧል",
        delete: "ሰርዝ",
        edit: "አስተካክል",
        cancel: "ይቅር",
        confirm: "ይረጋገጡ",
        submit: "አስገባ",
        back: "ወደኋላ",
        next: "የቀጥለው",
        previous: "የመጨረሻው",
        close: "ዝጋ",
        loading: "በማስገባት ላይ...",
        error: "ስህተት",
        success: "ስኬት",
        warning: "ማስጠንቀቂያ",
        info: "መረጃ",
        yes: "አዎ",
        no: "አይ"
      },

    // Auth
    auth: {
      email: "ኢሜል",
      password: "የማለፊያ ቃል",
      confirmPassword: "የማለፊያ ቃል አድርገው ይገልጹ",
      forgotPassword: "የማለፊያ ቃላትን ረስተዋል?",
      rememberMe: "አስታውስኝ",
      noAccount: "መለያ የለዎትም?",
      haveAccount: "መለያ አለዎት?",
      signUp: "ተመዝገብ",
      signIn: "ግባ"
    },

    // Dashboard
    dashboard: {
      overview: "አጠቃላይ እይታ",
      settings: "ቅንብሮች",
      profile: "መገለጫ",
      notifications: "ማስታወቂያዎች",
      bookings: "የእኔ ትዕዛዞች",
      payments: "ክፍያዎች",
      wishlist: "የምፈልጋቸው"
    },

     // Admin
     admin: {
       verificationModeration: "የማረጋገጫ እና አስተዳደር",
       eventVerificationDesc: "የዓለም አቀፍ ማስተናገዶችን ይመልከቱ፣ ይስማሙ፣ እና ይፈትሉ።",
       requestResubmission: "ይቅርታ ይጠይቃል",
       resubmit: {
         youAreAsking: "ይህን ይጠይቃሉ፤",
         toResubmit: "ለማስተናገድ ይጠይቃል"
       },
       itemsToCorrect: "አስተዳደር የሚያስፈልጉ",
       itemsToCorrectPlaceholder: "የሚያስፈልጉ ሰነዶች ወይም መረጃ ዘርዝሩ...",
       sendRequest: "ጥያቄ ይላኩ",
       rejectEvent: "ዓለም አቀፍ አትቀበል",
       youAreRejecting: "ይህን አይቀበሉ፤",
       willNotifyOrganizer: "ይህ አድራጎት አዘጋጅን ያሳውቃል።",
       reasonForRejection: "የአለመቀበል ምክንያት",
       reasons: {
         incompleteInfo: "ተሟላ አልባሳት",
         invalidLocation: "ልክ ያልሆነ አካባቢ",
         suspiciousActivity: "ስህተት አለመመለስ",
         policyViolation: "የአስተዳደር ስርዓት ስህተት",
         duplicateEvent: "ተያይዘ ክስተት",
         other: "ሌላ"
       },
       customMessage: "ልምምር መልክት ለአዘጋጅ",
       customMessagePlaceholder: "ይህን ክስተት ለምን የተቀበለ በሚሊየን ዝርዝር ይስጡ...",
       confirmRejection: "አለመቀበልን አረጋግጡ",
       approveEvent: "ክስተት ይስማሙ",
       approveConfirmation: "ይህን ክስተት {event} ለማስተዳደር እርግጠኛ ነዎት? ይህ ክስተት በመለኪያ ወደ መስኮት ይወጣል።",
       commissionRate: "የኮሚሽን ምንዛሪ",
       estimatedCommission: "የተገመተ ኮሚሽን",
       optionalNote: "በማስታወቂያ የተለየ ማስታወቂያ ለአዘጋጅ",
       optionalNotePlaceholder: "ክስተትዎን በመልካም ሰነዶች ይጫውሩ!...",
        confirmApproval: "አረጋገጥ ይስማሙ",
        viewProfile: "መገለጫን እይ",
        userVerifications: "የተጠቃሚ ማረጋገጫዎች",
       eventVerifications: "የዓለም አቀፍ ማረጋገጫዎች",
       productVerifications: "የምርት ማረጋገጫዎች",
       pendingUsers: "የተዘገዩ ተጠቃሚዎች",
       pendingEvents: "የተዘገዩ ክስተቶች",
       pendingProducts: "የተዘገዩ ምርቶች",
       approve: "ይስማሙ",
       reject: "ይቃለሱ",
       review: "ይመልከቱ",
       status: "ሁኔታ",
       submittedOn: "የተላከበት",
       documents: "ሰነዶች",
       actions: "ውጤቶች"
     },
       itemsToCorrect: "አስተዳደር የሚያስፈልጉ",
       itemsToCorrectPlaceholder: "የሚያስፈልጉ ሰነዶች ወይም መረጃ ይዘርዝሩ...",
       sendRequest: "ጥያቄ ይላኩ",
       userVerifications: "የተጠቃሚ ማረጋገጫዎች",
       eventVerifications: "የዓለም አቀፍ ማረጋገጫዎች",
       productVerifications: "የምርት ማረጋገጫዎች",
       pendingUsers: "የተዘገዩ ተጠቃሚዎች",
       pendingEvents: "የተዘገዩ ክስተቶች",
       pendingProducts: "የተዘገዩ ምርቶች",
       approve: "ይስማሙ",
       reject: "ይቃለሱ",
       review: "ይመልከቱ",
       status: "ሁኔታ",
       submittedOn: "የተላከበት",
       documents: "ሰነዶች",
       actions: "ውጤቶች"
     },

      // Header
      header: {
        searchPlaceholder: "ፍለጋ...",
        welcome: "መነሻ",
        signInRegister: "ግባ / ተመዝገብ",
        newHere: "አዲስ ነዎት?",
        myOrders: "የእኔ ትዕዛዞች",
        messageCenter: "መልክት ማእከል",
        payments: "ክፍያዎች",
        wishlist: "የምፈልጋቸው",
        settings: "ቅንብሮች",
        helpCenter: "የእርዳኳ ማእከል",
        disputes: "አለመስማማቶች",
        signOut: "ውጣ",
        loginRequired: "ግባ ያስፈልጋል",
        loginDesc: "ወደ ክፍያ ለማምለጥ እንደ ቱርክ ተጠቃሚ ግቡ።",
        loginNow: "አሁን ግባ",
        cancel: "ይቅር"
      },

      // Cart & Checkout
      cart: {
        yourCart: "የእርስዎ ዘመቻ",
        selectPayment: "የክፍያ አስመልክት",
        choosePayment: "ትምህርትዎን ለማስፈጸም የተረጋገጠ የክፍያ ዘዴ ይምረጡ።",
        chapa: "ቻፓ",
        telebirr: "��ሌቢር",
        payWithCardBank: "በካርድ / ባንክ ይክፈሉ",
        mobileMoney: "ሞባይል ገንዘብ",
        processingPayment: "የክፍያ ሂደት",
        paymentWait: "ትምህርትዎን ለመቆየት ይጠብቁ...",
        orderConfirmedMsg: "ለግዢዎ እናመሰግናለን። የማረጋገጫ ኢሜል ተልኳሎት።",
        transactionId: "የስርዓት መታወቂያ",
        subtotal: "ንዑስ ድምር",
        shipping: "ማሳለፊያ",
        total: "ጠቅላላ",
        proceedToCheckout: "ወደ ክፍያ ይሂዱ",
        back: "ወደኋላ",
        payNow: "አሁን ይክፈሉ",
        secureCheckout: "በቻፓ & ቴሌቢር የተጠበቀ የክፍያ ሂደት"
      },

     // Footer
     footer: {
       tagline: "የኢትዮጵያ ሥራ ባህርያት በዘመናዊ የሕንድ አስተዳደር 2025 አማካኝነት በተሰራ የተለየ የተረጋገጠ ዋጋ መገበያ።",
       heritageExplorer: "የውስጥ ጥናት",
       curatedMarketplace: "የተመረጠ የማዘጋጀት",
       sacredCelebrations: "ቅዱስ በዓላት",
       artisanStories: "የአርቲስቶች ታሪኮች",
       regionalGuides: "የክልላዊ መምሪያዎች",
       supportTrust: "ድጋፍ & አስተማመን",
       helpCenter: "የእርዳኳ ማእከል",
       authenticityShield: "የማረጋገጫ መ🛡️",
       shippingReturns: "ማሳለፊያ & መመለስ",
       contactOffice: "የውስጥ ቢሮን ያግኙ",
       hubDispatch: "ዋና መልክት",
       newsletterText: "በ50,000+ ጠቃሚዎች ጋር ይቀላቀሉ ፤ ዓለም አቀፍ በዓላት እና አዲስ አርብ ለመገኘት ይፈልጉ።",
       emailPlaceholder: "የአስተዳደር ኢሜል",
       subscribe: "አቀላቀል",
       copyright: "© 2025 ኢትዮ-ክራፍት ሃብ በአገር ውስጥ በተወሰነ የሕንድ አስተዳደር ተደርጓል።",
       privacy: "ግላዊነት",
       terms: "ውሎች",
       international: "ዓለም አቀፍ"
     },

    // User Verification
    userVerification: {
      verificationRequests: "የማረጋገጫ ጥያቄዎች",
      businessName: "የንግድ ስም",
      category: "ምድብ",
      region: "ክልል",
      city: "ከተማ",
      submittedAt: "የተላከበት",
      approved: "ፈቃደኛ",
      rejected: "ውጥረት",
      underReview: "እየተመለከተ ይገኛል",
      pending: "በመጠባበቅ ላይ"
    },

      // Events
      events: {
        eventVerification: "የዓለም አቀፍ ማረጋገጫ",
        eventVerificationDesc: "የዓለም አቀፍ ማስተናገዶችን ይመልከቱ፣ ይስማሙ፣ እና ይፈትሉ።",
        eventDetails: "የዓለም አቀፍ ዝርዝር መረጃ",
        title: "የዓለም አቀፍ ርዕስ",
        description: "መግለጫ",
        location: "አካባቢ",
        date: "ቀን",
        time: "ሰዓት",
        capacity: "ችሎታ",
        organizer: "አዘጋጅ",
        pricingStructure: "የዋጋ መዋቅር",
        ticketTypes: "የትየት አይነቶች",
        commissionRate: "የኮሚሽን ምንዛሪ",
        estimatedCommission: "የተገመተ ኮሚሽን",
        submittedDocuments: "የተላከ ሰነዶች",
        requestResubmission: "ይቅርታ ይጠይቃል",
        rejectEvent: "ዓለም አቀፍ አትቀበል",
        approveEvent: "ዓለም አቀፍ አስተዳደር",
        noMatchFilters: "ምንም የለውም የሚገናኝ ክስተቶች ከተጠበቁ ፍለጋዎች ጋር።",
        rejectionReason: "የአለመቀበል ምክንያት",
        reVerificationRequired: "ዳግም ማረጋገጫ ያስፈልጋል",
        organizerChanges: "አዘጋጅ ይህንን የተለቀቀ ክስተት አስተዳደር አድርጓል። እባክዎ ዝርዝሩን ይመልከቱ።",
        lastEdited: "የሚቀርብበት:",
        pastEvents: "ያለፉ ክስተቶች",
        verified: "የተረጋገጠ",
        lowRisk: "ዝቅተኛ ጠበኝነት ተገኝቷል",
        includedServices: "የተካተቱ አገልግሎቶች",
        eventPolicies: "የክስተት መመሪያዎች",
        sections: {
          media: "የዓለም አቀፍ ሚዲያ",
          coreInfo: "መሠረታዊ መረጃ",
          schedule: "የዓለም አቀፍ ቀን መርሃ ግብር",
          hotels: "የተቀባይ ሆቴሎች",
          transportation: "መጓዝ",
          documents: "የተላከ ሰነዶች",
          pricing: "የዋጋ መዋቅር",
          servicesPolicies: "አገልግሎቶች & የአስተዳደር መመሪያዎች",
          organizerInfo: "የአዘጋጅ መረጃ",
          risk: "የጠበኝ ትንተና"
        }
      },

    // Products
    products: {
      productVerification: "የምርት ማረጋገጫ",
      artisanProfile: "የአርቲሰን መገለጫ",
      pricing: "ዋጋ",
      materials: "የማቴሪያል",
      careInstructions: "የአደጋ መመሪያዎች",
      sku: "SKU",
      stock: "ክምርት",
      shipping: "ማሳለፊያ",
      deliveryTime: "የማስረከብ ጊዜ"
    },

     // Forms
     forms: {
       required: "አስፈላጊ",
       optional: "ምርጫ",
       upload: "ሰቀም",
       dragDrop: "ወይም ጎተት አንሳ",
       fileTypes: "SVG, PNG, JPG ወይም GIF (ከፍተኛ የሆነ መስፈርት 800x400px)",
       addImage: "ምስል አክል",
       addFile: "ፋይል አክል"
     },

     // Documents
     documents: {
       files: "ፋይሎች",
       preview: "ቅድመ እይታ",
       download: "አውርድ"
     },

    // Status & Badges
    status: {
      active: "ንቁ",
      suspended: "ተዘግቷል",
      deleted: "ተሰርዟል",
      draft: "ረቂቅ",
      published: "ተለቋል",
      archived: "ተቀማል",
      pendingApproval: "በመወደድ ላይ",
      underReview: "በማረጋገጫ ላይ",
      pendingReVerification: "በመወደድ ላይ"
    },

    // Errors & Messages
    messages: {
      somethingWentWrong: "አንዳንድ ነገር ተሳክቷል",
      tryAgain: "እንደገና ይሞክሩ",
      noChanges: "ምንም ለውጥ የለም",
      changesSaved: "ለውጦች በተሳክተ መልኩ ተቀምጠዋል",
      deleteConfirm: "ይህን ነገር ለማስወገድ እርግጠኛ ነዎት?",
      actionRequired: "የሚያስፈልግ ውጤት"
    }
  }
};

export default translations;
