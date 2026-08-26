# The wrapper has no reflection or JavaScript interface, so R8 can safely use
# its strongest optimizations and place obfuscated classes in a neutral package.
-allowaccessmodification
-repackageclasses 'com.jester.minidayz.runtime'
-adaptclassstrings

# Do not leak original source filenames or local line mappings in release code.
-renamesourcefileattribute SourceFile
