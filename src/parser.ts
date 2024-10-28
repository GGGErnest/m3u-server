import fs, { WriteStream } from 'fs';
import readline from 'readline';

export interface Filter {
  name: string;
  country?: string;
  quality?: string;
  renameTo?: string;
}

export interface ChannelFilter extends Filter {
  group?: string;
}

function isChannelFilter(filter: any): filter is ChannelFilter {
  return filter && 'group' in filter;
}

export interface PlayList {
  header: string;
  items: PlayListItem[];
}

export interface PlayListItem {
  name: string;
  country?: string;
  quality?: string;
  raw: string;
  urls: string[];
}

export interface PlayListGroupItem extends PlayListItem {
  channels: PlayListItem[];
}

export function isPlayListGroup(item: any): item is PlayListGroupItem {
  return item && 'channels' in item;
}

function isCategory(line: string) {
  return line.includes('#EXTINF:-1,#');
}

function isChannel(line: string) {
  return !isCategory(line) && !line.startsWith('http:');
}

function parseEntry(line: string, group?: PlayListGroupItem, channel?: PlayListItem): PlayListItem | undefined {
  const is = (isCategory(line) ? 'group' : undefined) || (isChannel(line) ? 'channel' : undefined) || 'url';
  const title = line.replace('#EXTINF:-1,', '').replace(/#/g, '');
  const raw = line + '\n';

  const parseCountry = (value: string) => {
    const countryMatch = value.match(/\b(CUBA|CUB|LATINO|SP|EN|AE|BE|AR|AU|BR|CA|CH|CN|DE|ES|FR|GB|IN|IT|JP|MX|NL|PT|RU|TR|US|ZA)\b/);
    const country = countryMatch ? countryMatch[0] : undefined;
    const rest = value.replace(country ?? '', '');

    return { rest, country };
  };

  const processQuality = (value: string) => {
    const qualityMatch = value.match(/\b(HD|FHD|4K|SD|UHD)\b/);
    const quality = qualityMatch ? qualityMatch[0] : undefined;
    const rest = value.replace(quality ?? '', '');
    return { quality, rest };
  };

  const processName = (value: string) => {
    return value
      .replace(/[^a-zA-Z0-9\s\|]/g, '')  // Keep English letters, numbers, spaces, '-', '*', and '|'
      .replace(/\s{2,}/g, ' ')               // Replace two or more spaces with a single space
      .trim();
  };


  const { country, rest } = parseCountry(title);
  const { quality, rest: restOfTtitle } = processQuality(rest);
  const name = processName(restOfTtitle);

  if (is === 'group') {
    return {
      name,
      country,
      quality,
      raw,
      channels: [],
      urls: []
    } as PlayListGroupItem;
  }

  if (is === 'channel') {
    return {
      name,
      country,
      quality,
      raw,
      urls: []
    } as PlayListItem;
  }

  // if the url doesn't belongs to any group or channel then we drop it
  if (!channel && !group) {
    console.log('Invalid Line. Does not belongs to any channel or group');
  }

  if (channel) {
    channel.urls.push(raw);
    channel.raw = channel.raw + raw;
    return channel;
  }

  if (group) {
    group.urls.push(raw);
  }

  return channel;
}


export async function parse(inputFilePath: string) {
  const readInterface = readline.createInterface(
    fs.createReadStream(inputFilePath),
  );

  const parsedFile: PlayList = {
    header: '',
    items: []
  };

  let currentGroup: PlayListGroupItem | undefined;
  let currentChannel: PlayListItem | undefined;

  // parsing file
  for await (const line of readInterface) {

    // extracting the header 
    if (!parsedFile.header && line.startsWith('#EXTM3U')) {
      parsedFile.header = line;
      continue;
    }

    const entry = parseEntry(line, currentGroup, currentChannel);
    // found a group
    if (isPlayListGroup(entry)) {
      // change group
      currentGroup = entry;
      currentChannel = undefined;
      parsedFile.items.push(currentGroup);
      continue;
    }

    // the parsed line is a new channel 
    if (currentChannel !== entry && entry) {
      currentChannel = entry;
      if (currentGroup) {
        currentGroup.channels.push(entry);
        continue;
      }
      parsedFile.items.push(entry);
      continue;
    }
  }
  console.log('The File as been parsed');
  return parsedFile;
}

function shouldIncludeChannel(entry: PlayListItem, filters: ChannelFilter[], group?: PlayListGroupItem) {

  const filterPlayList = (item: PlayListItem, filter: ChannelFilter, groupEntry?: PlayListGroupItem) => {
    const { name, country, quality, group } = filter;
    const conditions = [
      name ? item.name === name : true,
      country ? item.country === country : true,
      quality ? item.quality === quality : true,
      group ? groupEntry?.name.includes(group) : true
    ];

    return conditions.every(Boolean);
  }

  for (let filter of filters) {
    if (filterPlayList(entry, filter, group)) {
      return true;
    }
  }

  return false;
}

function shouldIncludeGroup(group: PlayListGroupItem, filters: Filter[]) {
  const filterGroups = (item: PlayListGroupItem, filter: Filter) => {
    const { name, country, quality } = filter;
    const conditions = [
      name ? item.name === name : true,
      country ? item.country === country : true,
      quality ? item.quality === quality : true,
    ];

    return conditions.every(Boolean);
  };

  for (let filter of filters) {
    if (filterGroups(group, filter)) {
      return true;
    }
  }
  return false;
}

function writeChannel(channel: PlayListItem, file: WriteStream) {
  file.write(channel.raw);
}

export function applyFilters(playlist: PlayList, filters: Filter[]): PlayList {
  const filteredPlaylist: PlayList = {
    header: playlist.header,
    items: []
  }

  const groupFilters = filters.filter((filter) => !isChannelFilter(filter));
  const channelFilters = filters.filter((filter) => isChannelFilter(filter));

  for (let item of playlist.items) {
    if (isPlayListGroup(item)) {
      if (shouldIncludeGroup(item, groupFilters)) {
        filteredPlaylist.items.push(item);
        continue;
      }

      item.channels = item.channels.filter((channel) => shouldIncludeChannel(channel, channelFilters, item));
      if (item.channels.length > 0) {
        filteredPlaylist.items.push(item);
      }
      continue;
    }

    if (shouldIncludeChannel(item, channelFilters)) {
      filteredPlaylist.items.push(item);
      continue;
    }
  }

  return filteredPlaylist;
}

export async function exportToM3U(playlist: PlayList, outputFilePath: string) {
  const file = fs.createWriteStream(outputFilePath);

  // writing the header;
  file.write(playlist.header);

  const writeGroup = (group: PlayListGroupItem) => {
    // writing the group header
    file.write(group.raw);
    for (let channel of group.channels) {
      writeChannel(channel, file);
    }
  }

  for (let item of playlist.items) {
    if (isPlayListGroup(item)) {
      writeGroup(item,);
      continue;
    }

    writeChannel(item, file);
  }

  file.close();
}

