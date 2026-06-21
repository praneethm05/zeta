module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 ships its worklets plugin from react-native-worklets.
    // Must remain the LAST plugin in the list.
    plugins: ['react-native-worklets/plugin'],
  };
};
