// swift-tools-version: 5.9
//
//  Package.swift
//  Echo iOS App Dependencies
//

import PackageDescription

let package = Package(
    name: "Echo",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "Echo",
            targets: ["Echo"]
        ),
    ],
    dependencies: [
        // SQLite database with encryption
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "6.0.0"),

        // SQLCipher for encryption
        .package(url: "https://github.com/sqlcipher/sqlcipher.git", from: "4.5.0"),

        // Networking
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),

        // Keychain access
        .package(url: "https://github.com/evgenyneu/keychain-swift.git", from: "20.0.0"),
    ],
    targets: [
        .target(
            name: "Echo",
            dependencies: [
                .product(name: "GRDB", package: "GRDB.swift"),
                "Alamofire",
                .product(name: "KeychainSwift", package: "keychain-swift")
            ]
        ),
        .testTarget(
            name: "EchoTests",
            dependencies: ["Echo"]
        ),
    ]
)
