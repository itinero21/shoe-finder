module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Transform private class fields for Hermes compatibility
          unstable_transformProfile: 'hermes-stable',
        },
      ],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
