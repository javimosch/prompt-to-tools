export default {
  props: ['item'],
  template: `
    <div class="curl-item p-4 border rounded">
      
      <span class="font-bold text-blue-600">{{item.title}}</span>
      <h4 class="text-md font-medium">{{ item.method }} {{ item.relativeURL }}</h4>
      <pre class="bg-gray-100 p-2 rounded">
        <code>
          Payload: {{ JSON.stringify(item.payload, null, 2) }}
        </code>
      </pre>
      <button @click="executeCurl(item)" class="mt-2 bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600">Execute</button>
      <textarea readonly rows="5" cols="40" :value="item.result || 'No result yet'" :disabled="true" class="mt-2 border rounded p-2 w-full"></textarea>
    </div>
  `,
  methods: {
    executeCurl(item) {
      this.$emit('execute-curl', item);
    },
  },
};
