window.ROMAN_EQUIPMENT_MANIFEST = {
  "version": 1,
  "character": "roman_soldier",
  "projectRoot": "../../..",
  "grid": {
    "columns": 6,
    "rows": 4,
    "cellWidth": 256,
    "cellHeight": 256
  },
  "motions": {
    "walk": {
      "row": 0,
      "poseFamily": "one_handed_walk"
    },
    "jump": {
      "row": 0,
      "poseFamily": "one_handed_airborne",
      "composition": "pose_specific_generated",
      "decisionLevel": 4,
      "frameMap": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    "vaultDown": {
      "row": 1,
      "poseFamily": "one_handed_platform_vault_down",
      "composition": "pose_specific_generated",
      "decisionLevel": 4,
      "frameMap": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "duration": 0.34
    },
    "attack": {
      "row": 1,
      "poseFamily": "one_handed_forward_thrust"
    },
    "shield": {
      "row": 2,
      "poseFamily": "shield_block"
    },
    "sling": {
      "row": 3,
      "poseFamily": "throwing"
    }
  },
  "armors": {
    "bronze": {
      "canonical": "assets/hero-roman-v4.png"
    },
    "silver": {
      "canonical": "assets/hero-roman-silver-v1.png"
    }
  },
  "weapons": {
    "gladius": {
      "family": "one_handed_sword",
      "composition": "canonical"
    },
    "master": {
      "family": "one_handed_sword",
      "composition": "wide_cells",
      "decisionLevel": 3,
      "outputCellWidth": 512,
      "framePaddingX": 128,
      "editMode": "built-in image editing",
      "referenceAsset": "assets/master-diamond-sword-v1.png",
      "canonicalSourcesByArmor": {
        "bronze": "assets/hero-roman-v4.png",
        "silver": "assets/hero-roman-silver-v1.png"
      },
      "sourcesByArmor": {
        "bronze": "assets/hero-roman-master-imageedit-v3.png",
        "silver": "assets/hero-roman-silver-master-imageedit-v3.png"
      },
      "outputsByArmor": {
        "bronze": "assets/characters/roman/assembled/bronze-master.png",
        "silver": "assets/characters/roman/assembled/silver-master.png"
      },
      "editedRows": [
        0,
        1
      ],
      "sharedRows": [
        2,
        3
      ],
      "patches": [],
      "anchors": {
        "walk": [
          [
            85.15,
            165.34,
            -117.79
          ],
          [
            70.87,
            162.93,
            -114.03
          ],
          [
            82.27,
            172.11,
            -119.25
          ],
          [
            87.29,
            173.08,
            -119.48
          ],
          [
            73.39,
            171.91,
            -120.62
          ],
          [
            36.89,
            168.87,
            -114.39
          ]
        ],
        "attack": [
          [
            98.02,
            169.6,
            -116.1
          ],
          [
            137.8,
            93.98,
            78.57
          ],
          [
            142.06,
            121.06,
            -83.9
          ],
          [
            142,
            111.29,
            -88.33
          ],
          [
            157.14,
            131.68,
            -80.33
          ],
          [
            62.56,
            161.71,
            -109.18
          ]
        ]
      }
    },
    "diamond": {
      "family": "one_handed_sword",
      "composition": "sparse_patches",
      "decisionLevel": 2,
      "sourcesByArmor": {
        "bronze": "assets/hero-roman-diamond-v1.png",
        "silver": "assets/hero-roman-silver-diamond-v1.png"
      },
      "outputsByArmor": {
        "bronze": "assets/characters/roman/assembled/bronze-diamond.png",
        "silver": "assets/characters/roman/assembled/silver-diamond.png"
      },
      "patches": [
        {
          "row": 0,
          "frame": 0,
          "rect": [
            90,
            160,
            100,
            75
          ]
        },
        {
          "row": 0,
          "frame": 1,
          "rect": [
            80,
            160,
            100,
            80
          ]
        },
        {
          "row": 0,
          "frame": 2,
          "rect": [
            75,
            160,
            100,
            75
          ]
        },
        {
          "row": 0,
          "frame": 3,
          "rect": [
            75,
            160,
            100,
            75
          ]
        },
        {
          "row": 0,
          "frame": 4,
          "rect": [
            70,
            160,
            105,
            75
          ]
        },
        {
          "row": 0,
          "frame": 5,
          "rect": [
            45,
            160,
            110,
            75
          ]
        },
        {
          "row": 1,
          "frame": 0,
          "rect": [
            75,
            145,
            105,
            80
          ]
        },
        {
          "row": 1,
          "frame": 1,
          "rect": [
            30,
            55,
            110,
            55
          ]
        },
        {
          "row": 1,
          "frame": 2,
          "rect": [
            150,
            85,
            94,
            70
          ],
          "sourceRect": [
            150,
            85,
            106,
            70
          ],
          "clearRect": [
            150,
            85,
            106,
            70
          ],
          "taperRight": true
        },
        {
          "row": 1,
          "frame": 3,
          "rect": [
            150,
            85,
            94,
            70
          ],
          "sourceRect": [
            150,
            85,
            106,
            70
          ],
          "clearRect": [
            150,
            85,
            106,
            70
          ],
          "taperRight": true
        },
        {
          "row": 1,
          "frame": 4,
          "rect": [
            150,
            85,
            94,
            70
          ],
          "sourceRect": [
            150,
            85,
            106,
            70
          ],
          "clearRect": [
            150,
            85,
            106,
            70
          ],
          "taperRight": true
        },
        {
          "row": 1,
          "frame": 5,
          "rect": [
            70,
            145,
            100,
            75
          ]
        }
      ],
      "cleanup": [
        {
          "row": 1,
          "frame": 4,
          "rect": [
            0,
            88,
            28,
            62
          ]
        },
        {
          "row": 1,
          "frame": 5,
          "rect": [
            0,
            88,
            28,
            62
          ]
        }
      ],
      "anchors": {
        "walk": [
          [
            103,
            193,
            15
          ],
          [
            85,
            194,
            12
          ],
          [
            80,
            195,
            12
          ],
          [
            80,
            195,
            12
          ],
          [
            76,
            195,
            12
          ],
          [
            70,
            195,
            12
          ]
        ],
        "attack": [
          [
            104,
            188,
            10
          ],
          [
            95,
            82,
            180
          ],
          [
            186,
            117,
            0
          ],
          [
            188,
            118,
            0
          ],
          [
            188,
            120,
            0
          ],
          [
            88,
            183,
            0
          ]
        ]
      }
    }
  },
  "sharedRows": [
    {
      "name": "shield",
      "row": 2
    },
    {
      "name": "sling",
      "row": 3
    }
  ],
  "validation": {
    "cellPadding": 12,
    "maxAnchorJump": 120
  },
  "motionSheets": {
    "grid": {
      "columns": 6,
      "rows": 2,
      "cellWidth": 256,
      "cellHeight": 256
    },
    "transparentGutter": 10,
    "bottomAnchor": 246,
    "sourcesByArmorAndWeapon": {
      "bronze": {
        "gladius": "assets/characters/roman/motions/bronze-gladius-jump-vault-v1.png",
        "diamond": "assets/characters/roman/motions/bronze-diamond-jump-vault-v1.png",
        "master": "assets/characters/roman/motions/bronze-master-jump-vault-v1.png"
      },
      "silver": {
        "gladius": "assets/characters/roman/motions/silver-gladius-jump-vault-v1.png",
        "diamond": "assets/characters/roman/motions/silver-diamond-jump-vault-v1.png",
        "master": "assets/characters/roman/motions/silver-master-jump-vault-v1.png"
      }
    },
    "sourceFacingByArmor": {
      "bronze": "right",
      "silver": "left"
    },
    "sourceFacingByArmorAndWeapon": {
      "bronze": {
        "gladius": "right",
        "diamond": "left",
        "master": "left"
      },
      "silver": {
        "gladius": "left",
        "diamond": "left",
        "master": "left"
      }
    }
  }
};
