Hello, I’d like to ask how data synchronization works with this plugin. Since I am not using Obsidian’s official sync service, I am using this plugin https://community.obsidian.md/plugins/sync-engine for WebDAV synchronization.
I hadn't really paid much attention to the phone before, so I didn't report this to you earlier; I only noticed it today.

The problem is described as follows:
During synchronization, even when the plugin data on both ends is initially identical, the data on one end suddenly gets completely lost (reverting to the default state) at some point during the process. I examined the data.json file for the "Colorful" plugin; my preliminary assessment is that this is highly likely caused by the direct writing of a large volume of icon data into the file.
I am not sure how this icon is downloaded, so I don't have a clear idea about it; however, I am fairly certain that the issue does not lie with my synchronization plugin, as the data for my other plugins remains intact and free of any loss on both ends.
I was wondering if the plugin configuration storage method could be optimized—perhaps to make synchronization smoother and prevent data loss on one end caused by massive conflicts? (Personally, I wouldn't mind at all if it meant downloading icon packs locally for greater stability.) For instance, the configuration approach used by "Notebook Navigator" is excellent.

Also, does the backup include the settings for all the plugins? Because sometimes, after restoring a backup, I find that some plugin settings haven't actually changed... 😅