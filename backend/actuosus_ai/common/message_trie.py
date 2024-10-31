from typing import List, Union, Dict, Optional, Tuple
import json
from typing import TypedDict

from actuosus_ai.ai_interaction.text_generation_service import WordProbList


class Message(TypedDict):
    source: str
    content: List[WordProbList | str]


class MessageTrieNode:
    def __init__(self, source: str, content: WordProbList):
        self.children: Dict[str, MessageTrieNode] = {}
        self.content = content
        self.source = source

    def to_dict(self) -> dict:
        """Convert the node to a dictionary for JSON serialization"""
        return {
            "children": {k: v.to_dict() for k, v in self.children.items()},
            "content": self.content,
            "source": self.source,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MessageTrieNode":
        """Create a node from a dictionary (for deserialization)"""
        node = cls(data["source"], data["content"])
        node.children = {k: cls.from_dict(v) for k, v in data["children"].items()}
        return node


class MessageTrie:
    def __init__(self):
        self.root = MessageTrieNode("", [])

    def serialize(self) -> str:
        """Serialize the trie to a JSON string"""
        return json.dumps(self.root.to_dict(), separators=(",", ":"))

    @classmethod
    def deserialize(cls, json_string: str) -> "MessageTrie":
        """Create a trie from a JSON string"""
        trie = cls()
        data = json.loads(json_string)
        trie.root = MessageTrieNode.from_dict(data)
        return trie

    def insert(self, messages: List[Message]) -> None:
        """Insert a list of messages into the trie"""
        current = self.root
        for message in messages:
            for item in message["content"]:
                repr_val = item[0][0] if isinstance(item, list) else item
                if repr_val not in current.children:
                    current.children[repr_val] = MessageTrieNode(
                        message["source"], item if isinstance(item, list) else []
                    )
                current = current.children[repr_val]

    def search_and_return(self, messages: List[Message]) -> Optional[List[Message]]:
        """Search for messages in the trie and return the complete history"""
        result: List[Message] = []
        current = self.root

        for message in messages:
            new_message: Message = {
                "content": [],
                "source": message["source"],
            }
            for item in message["content"]:
                repr_val = item if isinstance(item, str) else item[0][0]
                if repr_val in current.children:
                    if current.children[repr_val].source == message["source"]:
                        new_message["content"].append(
                            current.children[repr_val].content
                            if current.children[repr_val].content
                            else repr_val
                        )
                        current = current.children[repr_val]
                        continue
                return None
            result.append(new_message)

        # Continue building the tree with the latest children for a complete history
        cur_source = result[-1]["source"]
        new_message = result.pop() if result else None

        while current.children:
            # Pick the last child
            last_child_key = list(current.children.keys())[-1]
            last_child = current.children[last_child_key]

            # If the source is different, start a new message
            if last_child.source != cur_source:
                if new_message:
                    result.append(new_message)
                new_message = {
                    "content": [],
                    "source": last_child.source,
                }
                cur_source = last_child.source

            # Build the message
            new_message["content"].append(
                last_child.content if last_child.content else last_child_key
            )
            current = last_child

        # Push the last message
        if new_message:
            result.append(new_message)

        return result

    def clear(self) -> None:
        """Clear the trie"""
        self.root = MessageTrieNode("", [])
