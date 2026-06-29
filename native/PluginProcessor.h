#pragma once

#include <atomic>
#include <list>
#include <memory>
#include <vector>

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_audio_processors/juce_audio_processors.h>

#include <juce_javascript/juce_javascript.h>
#include <elem/Runtime.h>

class NativeBridgeObject;


//==============================================================================
class EffectsPluginProcessor
    : public juce::AudioProcessor,
      public juce::AudioProcessorParameter::Listener,
      private juce::AsyncUpdater
{
public:
    //==============================================================================
    EffectsPluginProcessor();
    ~EffectsPluginProcessor() override;

    //==============================================================================
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override;

    //==============================================================================
    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported (const juce::AudioProcessor::BusesLayout& layouts) const override;

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    //==============================================================================
    const juce::String getName() const override;

    bool acceptsMidi() const override;
    bool producesMidi() const override;
    bool isMidiEffect() const override;
    double getTailLengthSeconds() const override;

    //==============================================================================
    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram (int index) override;
    const juce::String getProgramName (int index) override;
    void changeProgramName (int index, const juce::String& newName) override;

    //==============================================================================
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    //==============================================================================
    /** Implement the AudioProcessorParameter::Listener interface. */
    void parameterValueChanged (int parameterIndex, float newValue) override;
    void parameterGestureChanged (int parameterIndex, bool gestureIsStarting) override;

    //==============================================================================
    /** Implement the AsyncUpdater interface. */
    void handleAsyncUpdate() override;

    //==============================================================================
    /** Internal helper for initializing the embedded JS engine. */
    void initJavaScriptEngine();

    /** Internal helper for propagating processor state changes. */
    void dispatchStateChange();
    void dispatchError(std::string const& name, std::string const& message);

private:
    friend class NativeBridgeObject;

    elem::Runtime<float>* getRuntime() const noexcept;
    void publishRuntime (std::unique_ptr<elem::Runtime<float>> nextRuntime);
    void collectRetiredRuntimes();

    //==============================================================================
    std::atomic<bool> shouldInitialize { false };
    std::atomic<int> activeProcessBlocks { 0 };
    double lastKnownSampleRate = 0;
    int lastKnownBlockSize = 0;

    elem::js::Object state;
    std::unique_ptr<juce::JavascriptEngine> jsContext;

    juce::AudioBuffer<float> scratchBuffer;

    // The audio thread only reads realtimeRuntime. Ownership stays on the message
    // thread, and replaced runtimes are retired after active processBlock calls exit.
    std::unique_ptr<elem::Runtime<float>> currentRuntime;
    std::vector<std::unique_ptr<elem::Runtime<float>>> retiredRuntimes;
    std::atomic<elem::Runtime<float>*> realtimeRuntime { nullptr };

    //==============================================================================
    // A simple "dirty list" abstraction here for propagating realtime parameter
    // value changes
    struct ParameterReadout {
        float value = 0;
        bool dirty = false;
    };

    std::list<std::atomic<ParameterReadout>> paramReadouts;
    static_assert(std::atomic<ParameterReadout>::is_always_lock_free);

    //==============================================================================
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (EffectsPluginProcessor)
};
