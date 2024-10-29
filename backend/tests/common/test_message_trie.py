import pytest

from actuosus_ai.common.message_trie import MessageTrie


class TestMessageTrie:
    @pytest.fixture
    def trie(self):
        return MessageTrie()

    def test_insert_simple_user_message_with_string(self, trie):
        """Test inserting a simple user message with a string content"""
        messages = [{"content": ["hello"], "source": "user"}]

        trie.insert(messages)

        assert "hello" in trie.root.children
        assert trie.root.children["hello"].source == "user"
        assert trie.root.children["hello"].content == []

    def test_insert_ai_message_with_word_prob_list(self, trie):
        """Test inserting an AI message with WordProbList content"""
        word_prob_list = [["test", 0.5], ["test2", 0.5]]
        messages = [{"content": ["string text", word_prob_list], "source": "ai"}]

        trie.insert(messages)

        assert "string text" in trie.root.children
        assert trie.root.children["string text"].source == "ai"
        assert trie.root.children["string text"].content == []
        assert "test" in trie.root.children["string text"].children
        assert (
            trie.root.children["string text"].children["test"].content == word_prob_list
        )

    def test_handle_conversation_sequence(self, trie):
        """Test handling a complete conversation sequence"""
        messages = [
            {"content": ["hello"], "source": "user"},
            {"content": ["hi", [["how", 0.8], ["I", 0.2]]], "source": "ai"},
            {"content": ["good"], "source": "user"},
        ]

        trie.insert(messages)

        node = trie.root.children["hello"]
        assert node is not None
        assert node.source == "user"

        node = node.children["hi"]
        assert node is not None
        assert node.source == "ai"

        node = node.children["how"]
        assert node is not None
        assert node.source == "ai"
        assert node.content == [["how", 0.8], ["I", 0.2]]

        node = node.children["good"]
        assert node is not None
        assert node.source == "user"

    def test_search_and_return_nonexistent(self, trie):
        """Test searching for non-existent message sequence"""
        result = trie.search_and_return(
            [{"content": ["nonexistent"], "source": "user"}]
        )
        assert result is None

    def test_search_and_return_complete_history(self, trie):
        """Test returning complete conversation history"""
        messages = [
            {"content": ["hello"], "source": "user"},
            {"content": ["hi", [["I am", 0.5], ["I will", 0.5]]], "source": "ai"},
            {"content": ["how are you"], "source": "user"},
        ]

        trie.insert(messages)

        search_result = trie.search_and_return(
            [
                {"content": ["hello"], "source": "user"},
                {"content": ["hi"], "source": "ai"},
            ]
        )

        assert search_result == messages

    def test_clear(self, trie):
        """Test clearing the trie"""
        messages = [{"content": ["hello"], "source": "user"}]

        trie.insert(messages)
        trie.clear()

        assert trie.root.children == {}
        assert trie.root.source == ""

    def test_empty_message_arrays(self, trie):
        """Test handling empty message arrays"""
        trie.insert([])
        assert trie.root.children == {}

    def test_serialization(self, trie):
        """Test serializing and deserializing the trie"""
        messages = [
            {"content": ["hello"], "source": "user"},
            {"content": ["hi", [["I am", 0.5], ["I will", 0.5]]], "source": "ai"},
            {"content": ["how are you"], "source": "user"},
        ]

        trie.insert(messages)

        serialized = trie.serialize()
        expected_json = '{"children":{"hello":{"children":{"hi":{"children":{"I am":{"children":{"how are you":{"children":{},"content":[],"source":"user"}},"content":[["I am",0.5],["I will",0.5]],"source":"ai"}},"content":[],"source":"ai"}},"content":[],"source":"user"}},"content":[],"source":""}'

        assert serialized == expected_json

        deserialized = MessageTrie.deserialize(serialized)
        assert deserialized.serialize() == trie.serialize()
